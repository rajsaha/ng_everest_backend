// Models
const mongoose = require("mongoose");
const ForgotPasswordModel = require("../../models/ForgotPassword");
const UserModel = require("../../models/User");
const dayjs = require('dayjs');
const Utility = require("../utility/Utility");
const bcryptjs = require("bcryptjs");

const ForgotPassword = (() => {
    const forgotPasswordStep1 = async (data) => {
        try {
            // * If email exists && ForgotPassword object does not ALREADY EXIST with that email
            // * Send email to user
            // * Generate code (create ForgotPassword model object)
            // * Return success message to user

            // ! If email does not exist
            // ! Return 400 message to user

            const user = await UserModel.findOne({
                email: data.email
            }).exec();

            if (!user) {
                return {
                    error: true,
                    message: "That email does not seem to exist"
                }
            }

            const existingForgetPassword = await ForgotPasswordModel.findOne({
                email: data.email,
                valid: true
            }, {
                timestamp: -1
            }).exec();

            if (existingForgetPassword) {
                return {
                    error: false,
                    message: "Email sent"
                }
            }

            const code = Math.floor(100000 + Math.random() * 900000);

            await Utility.sendEmail({
                code: code,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }, "forgotPassword");

            // * Save FP Entity
            const forgotPassword = new ForgotPasswordModel({
                _id: new mongoose.Types.ObjectId(),
                email: data.email,
                code: code,
                timestamp: dayjs().add(1, 'hour')
            });

            const forgotPasswordResult = await forgotPassword.save();

            if (forgotPasswordResult) {
                return {
                    error: false,
                    message: "Email sent"
                }
            }

            return {
                error: false,
                message: "Something went wrong"
            }
        } catch (err) {
            return {
                error: err.message,
            };
        }
    };

    const forgotPasswordStep2 = async (data) => {
        try {
            // * If code works, update Forgot Password object for that code
            // ! If code doesn't match, return error message to user

            const forgetPassword = await ForgotPasswordModel.findOne({
                email: data.email,
                code: data.code,
                valid: true
            });

            if (forgetPassword && dayjs().isBefore(forgetPassword.timestamp)) {
                return {
                    error: false,
                    message: "Correct code"
                }
            } else if (forgetPassword && dayjs().isAfter(forgetPassword.timestamp)) {
                await setFPTokenValidity({
                    code: data.code,
                    email: data.email,
                    valid: false
                });
                return {
                    error: true,
                    message: "Code has expired"
                }
            }

            return {
                error: true,
                message: "Incorrect code. Try again"
            }
        } catch (err) {
            return {
                error: err.message,
            };
        }
    };

    const forgotPasswordStep3 = async (data) => {
        try {
            // * Change password
            // * Return success message

            const forgetPassword = await ForgotPasswordModel.findOne({
                email: data.email,
                code: data.code,
                valid: true
            });

            if (!forgetPassword) {
                return {
                    error: true,
                    message: "What are you doing here? 🤔"
                }
            }

            let newPassword = bcryptjs.hashSync(data.password, 10);
            const update = {
                $set: {
                    password: newPassword,
                },
                safe: {
                    new: true,
                    upsert: true,
                },
            };

            // * Set token validitiy to false
            await setFPTokenValidity({
                code: data.code,
                email: data.email,
                valid: false
            });

            // * Update password
            await UserModel.updateOne({
                email: data.email
            }, update).exec();

            const user = await UserModel.findOne({
                email: data.email
            }).exec();
            
            await Utility.sendEmail({
                code: data.code,
                email: data.email,
                firstName: user.firstName,
                lastName: user.lastName
            }, "acknowledgePasswordChanged");

            return {
                error: false,
                message: "Password updated",
            };
        } catch (err) {
            return {
                error: true,
                message: err.message
            };
        }
    };

    const setFPTokenValidity = async (data) => {
        try {
            const update = {
                $set: {
                    valid: data.valid,
                },
                safe: {
                    new: true,
                    upsert: true,
                },
            };

            await ForgotPasswordModel.updateOne({
                email: data.email,
                code: data.code,
            }, update).exec();
        } catch (err) {
            return {
                error: true,
                message: err.message
            };
        }
    }


    return {
        forgotPasswordStep1,
        forgotPasswordStep2,
        forgotPasswordStep3
    };
})();

module.exports = ForgotPassword;