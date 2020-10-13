const ogs = require("open-graph-scraper");
const mongoose = require("mongoose");
const Resource = require("../../models/Resource");
const CollectionService = require("../collection/collection");
const Imgur = require("../imgur/imgur");
const Utility = require("../utility/Utility");

const ResourceShare = (() => {
  const getOpenGraphData = async (url) => {
    const response = await ogs({
      url: url,
    });

    if (!response) {
      return {
        message: response,
      };
    } else {
      return {
        message: {
          error: false,
          status: 200,
          data: response,
        },
      };
    }
  };

  const shareResource = async (data) => {
    try {
      let response = null;
      let sprLG = null;
      let sprMD = null;
      let sprSM = null;
      let lgImage = {
        link: null,
        id: null,
        deleteHash: null,
      };
      let mdImage = {
        link: null,
        id: null,
        deleteHash: null,
      };
      let smImage = {
        link: null,
        id: null,
        deleteHash: null,
      };

      // * Handle user uploading custom image
      if (data.formData.isCustomImage) {
        response = await Promise.all([
          Imgur.saveImage(data.formData.customImage, 600),
          Imgur.saveImage(data.formData.customImage, 275),
          Imgur.saveImage(data.formData.customImage, 100),
        ]);

        if (response[0].error) {
          return {
            error: true,
            message: 'Issue saving LG image: ' + response[0].message,
          };
        }

        if (response[1].error) {
          return {
            error: true,
            message: 'Issue saving MD image: ' + response[0].message,
          };
        }

        if (response[2].error) {
          return {
            error: true,
            message: 'Issue saving SM image: ' + response[0].message,
          };
        }

        sprLG = response[0];
        sprMD = response[1];
        sprSM = response[2];

        lgImage = {
          link: sprLG.data.data.link,
          id: sprLG.data.data.id,
          deleteHash: sprLG.data.data.deletehash,
        };

        mdImage = {
          link: sprMD.data.data.link,
          id: sprMD.data.data.id,
          deleteHash: sprMD.data.data.deletehash,
        };

        smImage = {
          link: sprSM.data.data.link,
          id: sprSM.data.data.id,
          deleteHash: sprSM.data.data.deletehash,
        };
      } else if (!data.formData.noImage) {
        // * Convert image to base64 and save to Imgur
        let base64Image = await Utility.convertImageFromURLToBase64(
          data.formData.ogImage
        );

        response = await Promise.all([
          Imgur.saveImage(base64Image, 600),
          Imgur.saveImage(base64Image, 275),
          Imgur.saveImage(base64Image, 100),
        ]);

        if (response[0].error) {
          return {
            error: true,
            message: 'Issue saving LG image: ' + response[0].message,
          };
        }

        if (response[1].error) {
          return {
            error: true,
            message: 'Issue saving MD image: ' + response[0].message,
          };
        }

        if (response[2].error) {
          return {
            error: true,
            message: 'Issue saving SM image: ' + response[0].message,
          };
        }

        sprLG = response[0];
        sprMD = response[1];
        sprSM = response[2];

        lgImage = {
          link: sprLG.data.data.link,
          id: sprLG.data.data.id,
          deleteHash: sprLG.data.data.deletehash,
        };

        mdImage = {
          link: sprMD.data.data.link,
          id: sprMD.data.data.id,
          deleteHash: sprMD.data.data.deletehash,
        };

        smImage = {
          link: sprSM.data.data.link,
          id: sprSM.data.data.id,
          deleteHash: sprSM.data.data.deletehash,
        };
      } else {
        // * Code for no image
      }

      const resource = new Resource({
        _id: new mongoose.Types.ObjectId(),
        userId: data.formData.userId,
        url: data.formData.url,
        title: data.formData.title,
        type: data.formData.type,
        description: data.formData.description,
        lgImage: lgImage,
        mdImage: mdImage,
        smImage: smImage,
        tags: data.tags,
        noImage: data.formData.noImage,
        backgroundColor: data.noImageData.backgroundColor,
        textColor: data.noImageData.textColor
      });

      await resource.save();

      if (data.collectionData) {
        if (!data.collectionData.newCollection) {
          await CollectionService.pushIntoCollection({
            collectionId: data.collectionData.collectionId,
            resourceId: resource.id,
            anchorUserId: data.formData.userId
          });
        } else {
          await CollectionService.createCollectionAndPushResource({
            userId: data.formData.userId,
            username: data.formData.username,
            collectionTitle: data.collectionData.collectionName,
            description: "",
            resourceId: resource.id,
          });
        }
      }

      return {
        message: {
          error: false,
          data: {
            message: "Resource saved!",
          },
        },
      };
    } catch (error) {
      console.error(error);
      return {
        error: true,
        error: error.message,
      };
    }
  };

  return {
    getOpenGraphData,
    shareResource,
  };
})();

module.exports = ResourceShare;
