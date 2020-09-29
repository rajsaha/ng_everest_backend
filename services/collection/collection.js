const mongoose = require("mongoose");
const _Collection = require("../../models/Collection");
const CollectionResource = require("../../models/CollectionResource");
const selectFields = "_id username title resources timestamp";

const Collection = (() => {
  const getCollectionTitles = async (data) => {
    try {
      const collections = await _Collection
        .find({
          username: data.username,
        })
        .exec();
      return {
        error: false,
        data: collections,
      };
    } catch (err) {
      console.log(err.message);
      return {
        error: true,
        message: err.message,
      };
    }
  };

  const getCollections = async (data) => {
    try {
      // Set up pagination
      const pageNo = parseInt(data.pageNo);
      const size = parseInt(data.size);
      let query = {};
      if (pageNo < 0 || pageNo === 0) {
        return {
          error: "Invalid page number",
        };
      }
      query.skip = size * (pageNo - 1);
      query.limit = size;

      let aggregateArray = [];

      if ("resourceId" in data) {
        aggregateArray = [
          {
            $lookup: {
              from: "collectionresources",
              localField: "_id",
              foreignField: "anchorCollectionId",
              as: "collectionResource",
            },
          },
          {
            $lookup: {
              from: "resources",
              localField: "collectionResource.resourceId",
              foreignField: "_id",
              as: "resources",
            },
          },
          {
            $facet: {
              collections: [
                {
                  $sort: {
                    timestamp: -1,
                  },
                },
                {
                  $match: {
                    username: data.username,
                  },
                },
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    title: 1,
                    description: 1,
                    timestamp: 1,
                    resource1: { $arrayElemAt: ["$resources", 0] },
                    count: {
                      $cond: {
                        if: { $isArray: "$resources" },
                        then: { $size: "$resources" },
                        else: "0",
                      },
                    },
                    inThisCollection: {
                      $filter: {
                        input: "$resources",
                        as: "re",
                        cond: {
                          $eq: [
                            "$$re._id",
                            mongoose.Types.ObjectId(data.resourceId),
                          ],
                        },
                      },
                    },
                  },
                },
                {
                  $skip: query.skip,
                },
                {
                  $limit: query.limit,
                },
              ],
              count: [
                {
                  $group: {
                    _id: 0,
                    count: { $sum: 1 },
                  },
                },
              ],
            },
          },
        ];
      } else {
        aggregateArray = [
          {
            $lookup: {
              from: "collectionresources",
              localField: "_id",
              foreignField: "anchorCollectionId",
              as: "collectionResource",
            },
          },
          {
            $lookup: {
              from: "resources",
              localField: "collectionResource.resourceId",
              foreignField: "_id",
              as: "resources",
            },
          },
          {
            $facet: {
              collections: [
                {
                  $sort: {
                    timestamp: -1,
                  },
                },
                {
                  $match: {
                    username: data.username,
                  },
                },
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    title: 1,
                    description: 1,
                    timestamp: 1,
                    resource1: { $arrayElemAt: ["$resources", 0] },
                    resource2: { $arrayElemAt: ["$resources", 1] },
                    resource3: { $arrayElemAt: ["$resources", 2] },
                    resource4: { $arrayElemAt: ["$resources", 3] },
                    count: {
                      $cond: {
                        if: { $isArray: "$resources" },
                        then: { $size: "$resources" },
                        else: "0",
                      },
                    },
                  },
                },
                {
                  $skip: query.skip,
                },
                {
                  $limit: query.limit,
                },
              ],
              count: [
                {
                  $group: {
                    _id: 0,
                    count: { $sum: 1 },
                  },
                },
              ],
            },
          },
        ];
      }

      const collections = await _Collection.aggregate(aggregateArray).exec();

      return {
        error: false,
        collections: collections,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getCollectionNameByResourceId = async (data) => {
    try {
      const collection = await _Collection
        .find({
          username: data.username,
          "resources.resourceId": data.resourceId,
        })
        .select("title")
        .exec();
      return {
        collection: collection,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getCollectionByTitle = async (data) => {
    try {
      const collection = await _Collection
        .findOne({
          title: { $regex: data.title, $options: "i" },
          username: data.username,
        })
        .exec();
      return {
        collection,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getCollectionById = async (data) => {
    try {
      // Set up pagination
      const pageNo = parseInt(data.pageNo);
      const size = parseInt(data.size);
      let query = {};
      if (pageNo < 0 || pageNo === 0) {
        return {
          error: "Invalid page number",
        };
      }
      query.skip = size * (pageNo - 1);
      query.limit = size;

      const collection = await _Collection
        .aggregate([
          {
            $match: {
              _id: mongoose.Types.ObjectId(data.id),
            },
          },
          {
            $lookup: {
              from: "collectionresources",
              localField: "_id",
              foreignField: "anchorCollectionId",
              as: "collectionResource",
            },
          },
          {
            $lookup: {
              from: "resources",
              localField: "collectionResource.resourceId",
              foreignField: "_id",
              as: "resources",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "resources.userId",
              foreignField: "_id",
              as: "users"
            }
          },
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              image: 1,
              timestamp: 1,
              resources: {
                $map: {
                  input: "$resources",
                  as: "resource",
                  in: {
                    _id: "$$resource._id",
                    description: "$$resource.description",
                    lgImage: "$$resource.lgImage",
                    mdImage: "$$resource.mdImage",
                    smImage: "$$resource.smImage",
                    title: "$$resource.title",
                    type: "$$resource.type",
                    url: "$$resource.url",
                    timestamp: "$$resource.timestamp",
                    recommended_by_count: "$$resource.recommended_by_count",
                    noImage: "$$resource.noImage",
                    backgroundColor: "$$resource.backgroundColor",
                    textColor: "$$resource.textColor",
                    username: {
                      $map: {
                        input: {
                          $filter: {
                            input: "$users",
                            as: "user",
                            cond: { $eq: ["$$user._id", "$$resource.userId"] }
                          }
                        },
                        as: "filteredUser",
                        in: {
                          username: "$$filteredUser.username"
                        }
                      }
                    }
                  }
                }
              },
              count: {
                $cond: {
                  if: { $isArray: "$resources" },
                  then: { $size: "$resources" },
                  else: "0",
                },
              },
            },
          },
        ])
        .exec();
      return {
        collection: collection[0],
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const pushIntoCollection = async (data) => {
    try {
      // * Create new collection resource document
      const collectionResource = new CollectionResource({
        anchorCollectionId: data.collectionId,
        resourceId: data.resourceId,
      });

      await collectionResource.save();

      return {
        message: {
          error: false,
          status: 200,
          data: {
            message: "Saved to collection!",
          },
        },
      };
    } catch (error) {
      console.error(error.message);
      return {
        status: 500,
        error: error.message,
      };
    }
  };

  const createCollectionAndPushResource = async (data) => {
    try {
      // * Create new collection
      const collection = new _Collection({
        anchorUserId: data.userId,
        username: data.username,
        title: data.collectionTitle,
        description: data.description,
      });

      await collection.save();

      const newCollectionResource = new CollectionResource({
        anchorCollectionId: collection.id,
        resourceId: data.resourceId,
      });

      await newCollectionResource.save();

      return {
        message: {
          error: false,
          status: 200,
          data: {
            message: "Saved to collection!",
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

  const checkForResourceInAnyCollection = async (data) => {
    try {
      const response = await CollectionResource.find({
        resourceId: data.id,
      }).exec();
      if (response.length > 0) {
        return {
          isInCollection: true,
          response,
        };
      }
      return {
        isInCollection: false,
      };
    } catch (err) {
      console.error(err.message);
      return {
        error: true,
        message: err.message,
      };
    }
  };

  const deleteResourceFromCollection = async (data) => {
    try {
      console.log(data);
      const response = await CollectionResource.deleteOne({
        anchorCollectionId: mongoose.Types.ObjectId(data.collectionId),
        resourceId: mongoose.Types.ObjectId(data.resourceId),
      }).exec();
      console.log(response);
      if (response) {
        return {
          error: false,
          message: response,
        };
      }
      return {
        error: true,
        message: response,
      };
    } catch (error) {
      console.error(err.message);
      return {
        error: true,
        message: err.message,
      };
    }
  };

  // * Duplicate function that uses username instead of collection Id
  const deleteResourceFromCollection2 = async (data) => {
    const response = await _Collection
      .updateOne(
        {
          username: data.username,
        },
        {
          $pull: {
            resources: data.resourceId,
          },
        }
      )
      .exec();
    if (response) {
      return true;
    }
    return false;
  };

  const deleteCollection = async (data) => {
    try {
      const response = await _Collection
        .deleteMany({
          _id: mongoose.Types.ObjectId(data.id),
        })
        .exec();

      const response2 = await CollectionResource.deleteMany({
        anchorCollectionId: mongoose.Types.ObjectId(data.id),
      }).exec();

      if (response && response2) {
        return {
          error: false,
          message: "Collection deleted",
        };
      }
      return {
        error: true,
      };
    } catch (err) {
      console.error(err);
      return {
        error: true,
        message: error.message,
      };
    }
  };

  const editCollectionDetails = async (data) => {
    try {
      const query = {
        _id: mongoose.Types.ObjectId(data.id),
      };
      const update = {
        title: data.title,
        description: data.description,
      };

      const response = await _Collection.updateOne(query, update).exec();
      if (response) {
        return {
          error: false,
          message: "Collection Edited",
        };
      }

      return false;
    } catch (err) {
      console.error(err);
      return {
        error: true,
        message: error.message,
      };
    }
  };

  const searchCollections = async (query, options) => {
    try {
      // ! If collection isn't selected
      if (!options.collection) {
        return;
      }
      const collections = await _Collection
        .find({ title: { $regex: `${query}`, $options: "i" } }, selectFields)
        .limit(10)
        .exec();

      return {
        collections,
      };
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        error: error.message,
      };
    }
  };

  const searchUserCollections = async (data) => {
    try {
      const collections = await _Collection
        .find(
          {
            username: data.username,
            title: { $regex: `${data.title}`, $options: "i" },
          },
          selectFields
        )
        .exec();

      return {
        collections,
      };
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        error: error.message,
      };
    }
  };

  const checkIfCollectionBelongsToUserLoggedIn = async (data) => {
    try {
      const collection = await _Collection
        .find({ username: data.username, _id: data.id })
        .exec();
      if (collection.length > 0) {
        return true;
      }

      return false;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  return {
    getCollections,
    getCollectionTitles,
    getCollectionNameByResourceId,
    getCollectionByTitle,
    getCollectionById,
    pushIntoCollection,
    createCollectionAndPushResource,
    checkForResourceInAnyCollection,
    deleteResourceFromCollection,
    deleteResourceFromCollection2,
    deleteCollection,
    searchUserCollections,
    searchCollections,
    checkIfCollectionBelongsToUserLoggedIn,
    editCollectionDetails,
  };
})();

module.exports = Collection;
