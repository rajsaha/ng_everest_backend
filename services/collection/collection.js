const mongoose = require("mongoose");
const _Collection = require("../../models/Collection");
const ResourceService = require("../../services/resource/get");
const selectFields = "_id username title resources timestamp";

const Collection = (() => {
  const getCollections = async username => {
    try {
      const collections = await _Collection
        .find({
          username: username
        })
        .exec();
      return {
        collections: collections
      };
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const getCollectionNames = async data => {
    try {
      // Set up pagination
      const pageNo = parseInt(data.pageNo);
      const size = parseInt(data.size);
      let query = {};
      if (pageNo < 0 || pageNo === 0) {
        return {
          error: "Invalid page number"
        };
      }
      query.skip = size * (pageNo - 1);
      query.limit = size;

      let collectionWithImages = [];
      const collections = await _Collection
        .find({
          username: data.username
        })
        .skip(query.skip)
        .limit(query.limit)
        .exec();
      for (let collection of collections) {
        const resources = collection.resources;
        if (resources[0]) {
          const result = await ResourceService.getResourceImage(resources[0].resourceId);
          collectionWithImages.push({
            id: collection.id,
            title: collection.title,
            image: result.smImage ? result.smImage : ""
          });
        } else {
          collectionWithImages.push({
            id: collection.id,
            title: collection.title,
            image: ""
          });
        }
      }

      return {
        collections: collectionWithImages
      };
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const getCollectionNameByResourceId = async data => {
    try {
      const collection = await _Collection
        .find({
          username: data.username,
          'resources.resourceId': data.resourceId
        })
        .select("title")
        .exec();  
      return {
        collection: collection
      };
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const getCollectionByTitle = async data => {
    try {
      const collection = await _Collection
        .findOne({
          title: data.title,
          username: data.username
        })
        .exec();
      return {
        collection
      };
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const getCollectionById = async id => {
    try {
      const collection = await _Collection.findById(id).exec();
      return {
        collection: collection
      };
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const pushIntoCollection = async data => {
    try {
      const query = {
        _id: data.collectionId,
        username: data.username
      };

      const update = {
        $push: {
          resources: { resourceId: data.resourceId, timestamp: data.timestamp }
        },
        safe: {
          new: true,
          upsert: true
        }
      };

      await _Collection.findOneAndUpdate(query, update).exec();

      return {
        message: {
          error: false,
          status: 200,
          data: {
            message: "Saved to collection!"
          }
        }
      };
    } catch (error) {
      console.error(error.message);
      return {
        status: 500,
        error: error.message
      };
    }
  };

  const createCollectionAndPushResource = async data => {
    try {
      let ifCollectionExists = false;
      // Check if collection exists
      const checkIfExists = await getCollectionByTitle({
        title: data.collectionTitle,
        username: data.username
      });

      if (
        checkIfExists.collection !== null &&
        checkIfExists.collection.title === data.collectionTitle
      ) {
        ifCollectionExists = true;
      }

      // ! If collection exists and it's a new resource...
      // ! push into collection
      if (ifCollectionExists && data.newResource) {
        await pushIntoCollection({
          collectionId: checkIfExists.collection.id,
          username: data.username,
          resourceId: data.resourceId,
          timestamp: data.formData.timestamp
        });

        return {
          message: {
            error: false,
            status: 200,
            data: {
              message: "Saved to collection!"
            }
          }
        };
      } else if (ifCollectionExists) {
        return {
          message: {
            error: true,
            status: 500,
            message: "Collection already exists!"
          }
        };
      }

      // * Create new collection
      const collection = new _Collection({
        username: data.username,
        title: data.collectionTitle
      });

      await collection.save();

      // * Push resource id into collection
      const query = {
        _id: collection.id
      };

      const update = {
        $push: {
          resources: { resourceId: data.resourceId }
        },
        safe: {
          new: true,
          upsert: true
        }
      };

      await _Collection.findOneAndUpdate(query, update).exec();

      return {
        message: {
          error: false,
          status: 200,
          data: {
            message: "Saved to collection!"
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

  const checkForResourceInAnyCollection = async data => {
    const response = await _Collection
      .find({
        'resources.resourceId': data.id,
        username: data.username
      })
      .exec();
    if (response.length > 0) {
      return {
        isInCollection: true,
        response
      };
    }
    return {
      isInCollection: false
    };
  };

  const deleteResourceFromCollection = async data => {
    const response = await _Collection
      .updateOne(
        {
          _id: data.collectionId
        },
        {
          $pull: {
            resources: { resourceId: data.resourceId }
          }
        }
      )
      .exec();
    if (response) {
      return true;
    }
    return false;
  };

  // * Duplicate function that uses username instead of collection Id
  const deleteResourceFromCollection2 = async data => {
    const response = await _Collection
      .updateOne(
        {
          username: data.username
        },
        {
          $pull: {
            resources: data.resourceId
          }
        }
      )
      .exec();
    if (response) {
      return true;
    }
    return false;
  };

  const deleteCollection = async id => {
    const response = await _Collection
      .deleteOne({
        _id: id
      })
      .exec();
    if (response) {
      return true;
    }
    return false;
  };

  const changeCollectionTitle = async data => {
    try {
      const query = {
        _id: data.id
      };
      const update = {
        title: data.title
      };

      const response = await _Collection.updateOne(query, update).exec();
      if (response) {
        return true;
      }

      return false;
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        error: error.message
      };
    }
  };

  const changeCollectionDescription = async data => {
    try {
      const query = {
        _id: data.id
      };
      const update = {
        description: data.description
      };

      const response = await _Collection.updateOne(query, update).exec();
      if (response) {
        return true;
      }

      return false;
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        error: error.message
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
        collections
      };
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        error: error.message
      };
    }
  };

  const searchUserCollections = async data => {
    try {
      const collections = await _Collection
        .find(
          {
            username: data.username,
            title: { $regex: `${data.title}`, $options: "i" }
          },
          selectFields
        )
        .exec();

      return {
        collections
      };
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        error: error.message
      };
    }
  };

  const checkIfCollectionBelongsToUserLoggedIn = async data => {
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
        error: err.message
      };
    }
  };

  return {
    getCollections,
    getCollectionNames,
    getCollectionNameByResourceId,
    getCollectionByTitle,
    getCollectionById,
    pushIntoCollection,
    createCollectionAndPushResource,
    checkForResourceInAnyCollection,
    deleteResourceFromCollection,
    deleteResourceFromCollection2,
    deleteCollection,
    changeCollectionTitle,
    changeCollectionDescription,
    searchUserCollections,
    searchCollections,
    checkIfCollectionBelongsToUserLoggedIn
  };
})();

module.exports = Collection;
