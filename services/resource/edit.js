const mongoose = require("mongoose");
const _Resource = require("../../models/Resource");
const Comment = require("../../models/Comment");
const CollectionService = require("../collection/collection");
const Imgur = require("../imgur/imgur");

const EditResource = (() => {
  const editResource = async data => {
    try {
      let response = null;
      let sprLG = null;
      let sprMD = null;
      let sprSM = null;

      const query = {
        _id: data.formData.id
      };

      let update = {
        $set: {
          url: data.formData.url ? data.formData.url : "",
          title: data.formData.title ? data.formData.title : "",
          description: data.formData.description
            ? data.formData.description
            : ""
        },
        $addToSet: {
          tags: {
            $each: data.tags
          }
        },
        safe: {
          new: true,
          upsert: true
        }
      };

      // * Handle user uploading custom image
      if (data.customImage) {
        // Delete resource images
        const deleteResourceImagesResponse = await deleteResourceImages(
          data.formData.id
        );
        if (deleteResourceImagesResponse) {
          console.log("Resource images deleted");
        }

        // Getting imgur data for custom image
        response = await Promise.all([
          Imgur.saveImage(data.customImage, 600),
          Imgur.saveImage(data.customImage, 275),
          Imgur.saveImage(data.customImage, 100)
        ]);

        sprLG = response[0];
        sprMD = response[1];
        sprSM = response[2];

        update.$set.lgImage = {
          link: sprLG.data.data.link,
          id: sprLG.data.data.id,
          deleteHash: sprLG.data.data.deletehash
        };

        update.$set.mdImage = {
          link: sprMD.data.data.link,
          id: sprMD.data.data.id,
          deleteHash: sprMD.data.data.deletehash
        };

        update.$set.smImage = {
          link: sprSM.data.data.link,
          id: sprSM.data.data.id,
          deleteHash: sprSM.data.data.deletehash
        };
      } else if (data.isUrlChanged) {
        // Delete resource images
        const deleteResourceImagesResponse = await deleteResourceImages(
          data.formData.id
        );
        if (deleteResourceImagesResponse) {
          console.log("Resource images deleted");
        }

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

        update.$set.lgImage = {
          link: sprLG.data.data.link,
          id: sprLG.data.data.id,
          deleteHash: sprLG.data.data.deletehash
        };

        update.$set.mdImage = {
          link: sprMD.data.data.link,
          id: sprMD.data.data.id,
          deleteHash: sprMD.data.data.deletehash
        };

        update.$set.smImage = {
          link: sprSM.data.data.link,
          id: sprSM.data.data.id,
          deleteHash: sprSM.data.data.deletehash
        };
      }

      // * Run update
      const resource = await _Resource.updateOne(query, update).exec();

      // * Put resource into collection or not
      if (data.formData.collectionName) {
        await CollectionService.createCollectionAndPushResource({
          collectionTitle: data.formData.collectionName,
          resourceId: data.formData.id,
          username: data.formData.username,
          newResource: false
        });
      }

      return {
        message: {
          error: false,
          status: 200,
          data: {
            message: "Resource updated!"
          }
        }
      };
    } catch (error) {
      console.error(error);
      return {
        status: 500,
        error: error.message
      };
    }
  };

  const addResourceToCollection = async data => {
    try {
      const collection = await CollectionService.getCollectionById(
        data.collectionId
      );
      const resource = await CollectionService.checkForResourceInAnyCollection({
        username: data.username,
        id: data.resourceId
      });

      // * Delete resource from existing collection
      if (
        resource.isInCollection &&
        data.collectionName !== resource.response[0].id
      ) {
        await CollectionService.deleteResourceFromCollection({
          collectionId: resource.response[0].id,
          resourceId: data.resourceId
        });
      }
      // * If collection exists and resource does NOT exist in collection
      if (collection.collection !== null) {
        if (collection.collection.id === data.collectionId) {
          // * Push into existing collection
          await CollectionService.pushIntoCollection({
            collectionId: collection.collection.id,
            username: data.username,
            resourceId: data.resourceId
          });
        }

        return true;
      }
    } catch (err) {
      console.log(err);
      return {
        error: err.message
      };
    }
  };

  const deleteResourceImages = async id => {
    try {
      const resource = await _Resource.findById(id).exec();
      const response = await Promise.all([
        Imgur.deleteImage(resource.lgImage.deleteHash),
        Imgur.deleteImage(resource.mdImage.deleteHash),
        Imgur.deleteImage(resource.smImage.deleteHash)
      ]);
      if (response[0] && response[1] && response[2]) {
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      return;
    }
  };

  const removeTag = async data => {
    try {
      await _Resource
        .updateOne(
          {
            _id: data.id
          },
          {
            $pull: {
              tags: data.tag
            }
          }
        )
        .exec();
      return {
        message: `${data.tag} removed`
      };
    } catch (err) {
      console.log(err);
      return {
        error: err.message
      };
    }
  };

  const addComment = async data => {
    try {
      const comment = new Comment({
        _id: new mongoose.Types.ObjectId(),
        resourceId: data.resourceId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        content: data.comment,
        timestamp: Date.now(),
        image: data.smImage,
      });

      const response = await comment.save();

      if (response) {
        return {
          status: true,
          comment
        };
      }

      return false;
    } catch (err) {
      console.log(err);
      return {
        error: err.message
      };
    }
  };

  return {
    editResource,
    addResourceToCollection,
    removeTag,
    addComment
  };
})();

module.exports = EditResource;
