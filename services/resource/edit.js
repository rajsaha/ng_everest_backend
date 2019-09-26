const _Resource = require('../../models/Resource');
const CollectionService = require('../collection/collection');
const Imgur = require('../imgur/imgur');

const EditResource = (() => {
    const editResource = async (data) => {
        try {
            let saveCustomImageForResourceResponse = null;
            let image = null;
            let deleteHash = null;

            // * Handle user uploading custom image
            if (data.customImage) {
                // * If deleteHash not null, delete image
                const checkForDeleteHashResult = await checkForDeleteHash(data.formData.id);
                if (checkForDeleteHashResult) {
                    console.log('Resource had deleteHash');
                }

                // * Get image link and delete hash from imgur
                saveCustomImageForResourceResponse = await Imgur.saveImage(data.customImage);
                image = saveCustomImageForResourceResponse.data.data.link;
                deleteHash = saveCustomImageForResourceResponse.data.data.deletehash;
            } else {
                image = data.formData.image;
            }

            const query = {
                _id: data.formData.id
            }

            const update = {
                $set: {
                    url: data.formData.url ? data.formData.url : '',
                    title: data.formData.title ? data.formData.title : '',
                    description: data.formData.description ? data.formData.description : '',
                    image: image,
                    deleteHash: deleteHash,
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

            // * Run update
            const resource = await _Resource.updateOne(query, update).exec();

            // * Put resource into collection or not
            if (data.formData.collectionName) {
                await editResourceCollection({
                    collectionTitle: data.formData.collectionName,
                    resourceId: data.formData.id,
                    username: data.formData.username
                });
            }

            return {
                message: {
                    error: false,
                    status: 200,
                    data: {
                        message: 'Resource updated!'
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

    const editResourceCollection = async (data) => {
        try {
            const collection = await CollectionService.getCollectionByTitle({collectionTitle: data.collectionTitle, username: data.username});
            const resource = await CollectionService.checkForResourceInAnyCollection({id: data.resourceId, username: data.username});

            // * Delete resource from existing collection
            if (resource.isInCollection && data.collectionName !== resource.response[0].title) {
                await CollectionService.deleteResourceFromCollection({
                    collectionId: resource.response[0].id,
                    resourceId: data.resourceId
                });
            }
            // * If collection exists and resource does NOT exist in collection
            if (collection.collection !== null) {
                if (collection.collection.title === data.collectionTitle) {
                    // * Push into existing collection
                    await CollectionService.pushIntoCollection({
                        collectionId: collection.collection._id,
                        username: data.username,
                        resourceId: data.resourceId
                    });
                }

                return true;
            } else {
                // * Create new collection and push resource into it
                await CollectionService.createCollectionAndPushResource({
                    username: data.username,
                    title: data.collectionTitle,
                    resourceId: data.resourceId
                });

                return true;
            }
        } catch (err) {
            console.log(err);
            return {
                error: err.message
            };
        }
    }

    const checkForDeleteHash = async (id) => {
        try {
            const resource = await _Resource.findById(id).exec();
            if (resource && resource.deleteHash) {
                await Imgur.deleteHash(resource.deleteHash);
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error(error);
            return;
        }
    }

    const removeTag = async (data) => {
        try {
            await _Resource.updateOne({
                _id: data.id
            }, {
                $pull: {
                    tags: data.tag
                }
            }).exec();
            return {
                message: `${data.tag} removed`
            }
        } catch (err) {
            console.log(err);
            return {
                error: err.message
            };
        }
    }

    const addComment = async (data) => {
        try {
            const query = {
                _id: data.resourceId
            };

            const comment = {
                username: data.username,
                content: data.comment,
                timestamp: Date.now()
            };

            const update = {
                $push: {
                    comments: comment
                },
                safe: {
                    new: true,
                    upsert: true
                }
            };
            const response = await _Resource.findOneAndUpdate(query, update).exec();

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
    }

    return {
        editResource,
        editResourceCollection,
        removeTag,
        addComment
    }
})()

module.exports = EditResource;