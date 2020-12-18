// Models
const mongoose = require("mongoose");
const ForgotPasswordModel = require("../../models/ForgotPassword");
const UserModel = require("../../models/User");
const nodemailer = require("nodemailer");
const dayjs = require('dayjs');

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

            // * Save FP Entity
            const code = Math.floor(100000 + Math.random() * 900000);
            const forgotPassword = new ForgotPasswordModel({
                _id: new mongoose.Types.ObjectId(),
                email: data.email,
                code: code,
                messageId: info.messageId,
                timestamp: dayjs().add(1, 'hour')
            });

            await forgotPassword.save();

            // * Send email
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            // send mail with defined transport object
            let info = await transporter.sendMail({
                from: '"Everest" <everest@gmail.com>',
                to: `${user.email}`,
                subject: "Everest - Forgot Password",
                text: `Everest - Forget Password. Here's the code you requested: ${code}`,
                html: `
                <div style='background-color: #f4f4f4; padding: 25px;'>
                    <div style='border-radius: 10px; background-color: white; margin-left: auto; margin-right: auto; max-width: 400px; padding: 25px; -webkit-box-shadow: 0px 5px 25px -9px rgba(0,0,0,0.52); box-shadow: 0px 5px 25px -9px rgba(0,0,0,0.52);'>
                        <div style='margin-bottom: 15px;'>
                            <img style='display: block; max-width: 350px;' src='https://www.tryeverest.app/assets/images/everest-logo.svg' alt='Everest Logo'></img>
                        </div>
                        <div style='height: 2px; width: 100%; border-radius: 10px; margin: 25px 0; background-color: rgba(0,0,0,0.1);'></div>
                        <p>Hello <b>${user.firstName} ${user.lastName}</b>,</p>
                        <p>You see to have forgotten your password. Here's the code you requested:</p>
                        <p style='font-size: 25px;'>${code}</p>
                        <p>This code will be valid for <b>1 hour</b></p>
                        <p>Cheers,<br>Everest Team</p>
                    </div>
                </div>`,
            });

            console.log("Message sent: %s", info.messageId);

            if (forgotPassword) {
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
                message: "Incorrect code"
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
            await User.updateOne({
                email: data.email
            }, update).exec();

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