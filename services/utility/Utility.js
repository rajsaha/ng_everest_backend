const sharp = require("sharp");
const axios = require("axios");
const nodemailer = require("nodemailer");
const EmailTemplate = require("../utility/EmailTemplate");

const Utility = (() => {
  const compressImage = async (data) => {
    try {
      let parts = data.image.split(";");
      let mimeType = parts[0].split(":")[1];
      let imageData = parts[1].split(",")[1];

      let image = new Buffer.from(imageData, "base64");
      let output = sharp(image)
        .resize(data.size)
        .toBuffer()
        .then((resizedImageBuffer) => {
          let resizedImageData = resizedImageBuffer.toString("base64");
          let resizedBase64 = `data:${mimeType};base64,${resizedImageData}`;
          return resizedBase64;
        })
        .catch((error) => {
          return error;
        });

      return output;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const convertImageFromURLToBase64 = async (url) => {
    try {
      const image = await axios.request({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        responseEncoding: 'binary'
      });
      let mimeType = image.headers["content-type"];
      let b64SansHeader = new Buffer.from(image.data, "binary").toString("base64");
      let b64 = `data:${mimeType};base64,${b64SansHeader}`;

      return b64;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const sendEmail = async (data, type) => {
    try {
      let template = "";
      let subject = "";
      let text = "";

      switch (type) {
        case "forgotPassword":
          template = EmailTemplate.getForgetPassword(data);
          subject = "Everest - Forgot Password";
          text = `Everest - Forget Password. Here's the code you requested: ${data.code}`;
          break;
        case "acknowledgePasswordChanged":
          template = EmailTemplate.getAcknowledgePasswordChanged(data);
          subject = "Everest - Password successfully changed";
          text = `Everest - Password successfully changed. If you did not issue a password change request, contact us at everest@everest.com`;
          break;
        default:
          template = EmailTemplate.getForgetPassword(data);
          break;
      }

      // * Send email
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"Everest" <rajsaha@tryeverest.app>',
        to: `${data.email}`,
        subject: subject,
        text: text,
        html: template.data,
        attachments: [{
          filename: 'everest-logo.svg',
          path: 'https://www.tryeverest.app/assets/images/everest-logo.svg',
          cid: 'logo1'
        }]
      });

      console.log("Message sent: %s", info.messageId);

      return {
        error: false,
        data: info
      }
    } catch (err) {
      return {
        error: true,
        message: err.message
      }
    }
  }

  return {
    compressImage,
    convertImageFromURLToBase64,
    sendEmail
  };
})();

module.exports = Utility;