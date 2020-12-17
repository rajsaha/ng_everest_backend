// Models
const mongoose = require("mongoose");
const ForgotPasswordModel = require("../../models/ForgotPassword");
const UserModel = require("../../models/User");
const ObjectId = mongoose.Types.ObjectId;
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

            const existingForgetPassword = await existingForgetPassword.findOne({ email: data.email });

            if (existingForgetPassword) {
                return {
                    error: false,
                    message: "Email sent"
                }
            }

            const code = Math.floor(100000 + Math.random() * 900000);

            const transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                auth: {
                    user: 'adrien.hahn@ethereal.email',
                    pass: 'eEFTfHm7ThHsFDC4ST'
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
                        <p>Cheers,</p>
                        <p>Everest Team</p>
                    </div>
                </div>`,
            });

            console.log("Message sent: %s", info.messageId);

            const forgotPassword = new ForgotPasswordModel({
                _id: new mongoose.Types.ObjectId(),
                email: data.email,
                code: code,
                messageId: info.messageId,
            });

            await forgotPassword.save();

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
            // * If code works, delete Forgot Password object for that code
            // ! If code doesn't match, return error message to user

            const forgetPassword = await ForgotPasswordModel.findOne({ code: data.code })

            if (forgetPassword) {
                return {
                    error: false,
                    message: "Correct code"
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
        } catch (err) {
            return {
                error: err.message,
            };
        }
    };


    return {
        forgotPasswordStep1,
        forgotPasswordStep2,
        forgotPasswordStep3
    };
})();

module.exports = ForgotPassword;