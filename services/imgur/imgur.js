const axios = require("axios");
const Utility = require("../utility/Utility");
const FormData = require('form-data');

const Imgur = (() => {
  const deleteImage = async (deleteHash) => {
    try {
      const deletePhoto = axios.create({
        headers: {
          Authorization: `Client-ID ${process.env.CLIENT_ID}`,
        },
      });

      await deletePhoto.delete(`${process.env.IMAGE_DELETE_URL}/${deleteHash}`);
      return true;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const saveImage = async (image, size) => {
    try {
      // TODO: Compress image
      const compressedImage = await Utility.compressImage({
        image,
        size,
      });
      const replacedBase64String = compressedImage.replace(
        /^data:image\/[a-z]+;base64,/,
        ""
      );
      const savePhoto = axios.create({
        headers: {
          Authorization: `Client-ID ${process.env.CLIENT_ID}`,
        },
      });
      const form = new FormData();
      form.append('image', replacedBase64String);
      form.append('type', 'base64');
      const savePhotoResponse = await savePhoto.post(
        process.env.IMAGE_UPLOAD_URL,
        form,
        { headers: form.getHeaders() }
      );
      return savePhotoResponse;
    } catch (err) {
      console.error(err.message);
      return {
        error: true,
        message: err.message,
      };
    }
  };

  return {
    deleteImage,
    saveImage,
  };
})();

module.exports = Imgur;
