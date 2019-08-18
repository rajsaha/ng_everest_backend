const mongoose = require('mongoose');
const _Collection = require('../../models/Collection');

const Collection = (() => {
    const getCollections = async (username) => {
        try {
            const collections = await _Collection.find({
                username: username
            }).exec();
            return {
                collections: collections
            }
        } catch (err) {
            return {
                error: err.message
            }
        }
    }

    const getCollectionNames = async (username) => {
        try {
            const collection = await _Collection.find({
                username: username
            }).select('title').exec();
            return {
                collections: collection
            }
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const getCollectionNameByResourceId = async (data) => {
        try {
            const collection = await _Collection.findOne({
                username: data.username,
                resources: data.resourceId
            }).select('title').exec();
            return {
                collection: collection
            }
        } catch (err) {
            return {
                error: err.message
            }
        }
    }

    const getCollectionByTitle = async (data) => {
        try {
            const collection = await _Collection.findOne({
                title: data.collectionName,
                username: data.username
            }).exec();
            return {
                collection: collection
            }
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const getCollectionById = async (id) => {
        try {
            const collection = await _Collection.findById(id).exec();
            return {
                collection: collection
            }
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const pushIntoCollection = async (data) => {
        try {
            const query = {
                title: data.title
            };

            const update = {
                $push: {
                    resources: data.resourceId
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
                        message: 'Saved to collection!'
                    }
                }
            };
        } catch (error) {
            return {
                status: 500,
                error: error.message
            };
        }
    }

    const createCollectionAndPushResource = async (data) => {
        try {
            // * Create new collection
            const collection = new _Collection({
                username: data.username,
                title: data.title
            });

            await collection.save();

            // * Push resource id into collection
            const query = {
                _id: collection.id
            };

            const update = {
                $push: {
                    resources: data.resourceId
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
                        message: 'Saved to collection!'
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
    }

    const checkForResourceInAnyCollection = async (data) => {
        const response = await _Collection.find({
            resources: data.id,
            username: data.username
        }).exec();
        if (response.length > 0) {
            return {
                isInCollection: true,
                response
            }
        }
        return {
            isInCollection: false
        };
    }

    const deleteResourceFromCollection = async (data) => {
        const response = await _Collection.updateOne({
            _id: data.collectionId
        }, {
                $pull: {
                    resources: data.resourceId
                }
            }).exec();
        if (response) {
            return true;
        }
        return false;
    }

    const deleteCollection = async (id) => {
        const response = await _Collection.deleteOne({ _id: id }).exec();
        if (response) {
            return true;
        }
        return false;
    }

    const changeCollectionTitle = async (data) => {
        try {
            const query = {
                _id: data.id
            }
            const update = {
                title: data.title
            };

            const response = await Collection.findOneAndUpdate(query, update).exec();
            if (response) {
                return true;
            }

            return false;
        } catch (err) {
            console.error(error);
            return {
                status: 500,
                error: error.message
            };
        }
    }

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
        deleteCollection,
        changeCollectionTitle
    }
})()

module.exports = Collection;