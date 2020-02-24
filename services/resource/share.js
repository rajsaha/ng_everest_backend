const ogs = require("open-graph-scraper");
const mongoose = require("mongoose");
const Resource = require("../../models/Resource");
const CollectionService = require("../collection/collection");
const Imgur = require("../imgur/imgur");
const Utility = require("../utility/Utility");

const ResourceShare = (() => {
  const getOpenGraphData = async url => {
    const response = await ogs({
      url: url
    });

    if (!response) {
      return {
        message: response
      };
    } else {
      return {
        message: {
          error: false,
          status: 200,
          data: response
        }
      };
    }
  };

  const shareResource = async data => {
    try {
      let response = null;
      let sprLG = null;
      let sprMD = null;
      let sprSM = null;

      // * Handle user uploading custom image
      if (data.customImage) {
        response = await Promise.all([
          Imgur.saveImage(data.customImage, 600),
          Imgur.saveImage(data.customImage, 275),
          Imgur.saveImage(data.customImage, 100)
        ]);

        sprLG = response[0];
        sprMD = response[1];
        sprSM = response[2];
      } else {
        // * Convert image to base64 and save to Imgur
        let base64Image = await Utility.convertImageFromURLToBase64(
          data.formData.image
        );

        response = await Promise.all([
          Imgur.saveImage(base64Image, 600),
          Imgur.saveImage(base64Image, 275),
          Imgur.saveImage(base64Image, 100)
        ]);

        sprLG = response[0];
        sprMD = response[1];
        sprSM = response[2];
      }

      const resource = new Resource({
        _id: new mongoose.Types.ObjectId(),
        userId: data.formData.userId,
        url: data.formData.url,
        title: data.formData.title,
        type: data.formData.type,
        description: data.formData.description,
        lgImage: {
          link: sprLG.data.data.link,
          id: sprLG.data.data.id,
          deleteHash: sprLG.data.data.deletehash
        },
        mdImage: {
          link: sprMD.data.data.link,
          id: sprMD.data.data.id,
          deleteHash: sprMD.data.data.deletehash
        },
        smImage: {
          link: sprSM.data.data.link,
          id: sprSM.data.data.id,
          deleteHash: sprSM.data.data.deletehash
        },
        tags: data.tags
      });

      await resource.save();

      if (data.collectionData) {
        if (!data.collectionData.newCollection) {
          await CollectionService.pushIntoCollection({
            collectionId: data.collectionData.collectionId,
            resourceId: resource.id,
            username: data.formData.username
          });
        } else {
          await CollectionService.createCollectionAndPushResource({
            username: data.formData.username,
            collectionTitle: data.collectionData.collectionName,
            resourceId: resource.id,
            newResource: true
          });
        }
      }

      return {
        message: {
          error: false,
          status: 200,
          data: {
            message: "Resource saved!"
          }
        }
      };
    } catch (error) {
      return {
        status: 500,
        error: error.message
      };
    }
  };

  return {
    getOpenGraphData,
    shareResource
  };
})();

module.exports = ResourceShare;
