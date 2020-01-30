const sharp = require("sharp");
const axios = require("axios");

const Utility = (() => {
  const compressImage = async data => {
    try {
      let parts = data.image.split(";");
      let mimeType = parts[0].split(":")[1];
      let imageData = parts[1].split(",")[1];

      let image = new Buffer.from(imageData, "base64");
      let output = sharp(image)
        .resize(data.size)
        .toBuffer()
        .then(resizedImageBuffer => {
          let resizedImageData = resizedImageBuffer.toString("base64");
          let resizedBase64 = `data:${mimeType};base64,${resizedImageData}`;
          return resizedBase64;
        })
        .catch(error => {
          return error;
        });

      return output;
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const convertImageFromURLToBase64 = async url => {
    try {
      let image = await axios.get(url, {responseType: 'arraybuffer'});
      let mimeType = image.headers["content-type"];
      let b64SansHeader = Buffer.from(image.data, "binary").toString('base64');
      let b64 = `data:${mimeType};base64,${b64SansHeader}`;

      return b64;
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  return {
    compressImage,
    convertImageFromURLToBase64
  };
})();

module.exports = Utility;
