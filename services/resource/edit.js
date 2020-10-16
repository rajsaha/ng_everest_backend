const mongoose = require("mongoose");
const _Resource = require("../../models/Resource");
const Comment = require("../../models/Comment");
const CollectionService = require("../collection/collection");
const Imgur = require("../imgur/imgur");

const EditResource = (() => {
  const editResource = async (data) => {
    try {
      let response = null;
      let sprLG = null;
      let sprMD = null;
      let sprSM = null;

      const query = {
        _id: data.formData.id,
      };

      let update = {
        $set: {
          title: data.formData.title ? data.formData.title : "",
          description: data.formData.description
            ? data.formData.description
            : "",
          noImage: data.formData.noImage,
          backgroundColor: data.noImageData.backgroundColor,
          textColor: data.noImageData.textColor
        },
        $addToSet: {
          tags: {
            $each: data.tags,
          },
        },
        safe: {
          new: true,
          upsert: true,
        },
      };

      // * Handle user uploading custom image
      if (data.formData.isCustomImage) {
        // Delete resource images
        const deleteResourceImagesResponse = await deleteResourceImages(
          data.formData.id
        );
        if (deleteResourceImagesResponse) {
          console.log("Resource images deleted");
        }

        // Getting imgur data for custom image
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

        update.$set.lgImage = {
          link: sprLG.data.data.link,
          id: sprLG.data.data.id,
          deleteHash: sprLG.data.data.deletehash,
        };

        update.$set.mdImage = {
          link: sprMD.data.data.link,
          id: sprMD.data.data.id,
          deleteHash: sprMD.data.data.deletehash,
        };

        update.$set.smImage = {
          link: sprSM.data.data.link,
          id: sprSM.data.data.id,
          deleteHash: sprSM.data.data.deletehash,
        };
      }

      // * Run update
      const resource = await _Resource.updateOne(query, update).exec();

      return {
        message: {
          error: false,
          data: {
            message: "Resource updated!",
          },
        },
      };
    } catch (error) {
      console.error(error);
      return {
        status: 500,
        error: error.message,
      };
    }
  };

  const addResourceToCollection = async (data) => {
    try {
      const response = await CollectionService.pushIntoCollection({
        anchorCollectionId: data.collectionId,
        resourceId: data.resourceId,
        anchorUserId: data.userId
      });

      if (!response.error) {
        return {
          error: false,
          data: {
            message: "Resource added to collection"
          }
        }
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.log(err);
      return {
        error: true,
        message: err.message
      };
    }
  };

  const deleteResourceImages = async (id) => {
    try {
      const resource = await _Resource.findById(id).exec();
      const response = await Promise.all([
        Imgur.deleteImage(resource.lgImage.deleteHash),
        Imgur.deleteImage(resource.mdImage.deleteHash),
        Imgur.deleteImage(resource.smImage.deleteHash),
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

  const removeTag = async (data) => {
    try {
      await _Resource
        .updateOne(
          {
            _id: data.id,
          },
          {
            $pull: {
              tags: data.tag,
            },
          }
        )
        .exec();
      return {
        message: `${data.tag} removed`,
      };
    } catch (err) {
      console.log(err);
      return {
        error: err.message,
      };
    }
  };

  const addComment = async (data) => {
    try {
      const comment = new Comment({
        _id: new mongoose.Types.ObjectId(),
        resourceId: data.resourceId,
        userId: data.userId,
        content: data.comment,
        timestamp: Date.now(),
        image: data.smImage,
      });

      const response = await comment.save();

      if (response) {
        let temp = await Comment.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $match: {
              _id: comment._id
            },
          },
          {
            $project: {
              firstName: "$user.firstName",
              lastName: "$user.lastName",
              username: "$user.username",
              image: { $ifNull: ["$user.smImage.link", ""] },
              content: data.comment,
              timestamp: Date.now()
            }
          }
        ]).exec();
        return {
          error: false,
          data: temp,
        };
      }

      return {
        error: true,
        message: response
      };
    } catch (err) {
      console.log(err);
      return {
        error: err.message,
      };
    }
  };

  return {
    editResource,
    addResourceToCollection,
    removeTag,
    addComment,
  };
})();

module.exports = EditResource;
