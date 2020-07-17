const _Resource = require('../../models/Resource');
const Imgur = require('../imgur/imgur');
const CollectionService = require('../collection/collection');

const DeleteResource = (() => {
    const deleteResource = async (data) => {
        try {
            const resource = await _Resource.findById(data.id).exec();
            if (resource) {
                // * Delete image, find and remove resource, clear resource id in collection if any
                const response = await Promise.all([
                    Imgur.deleteImage(resource.lgImage.deleteHash),
                    Imgur.deleteImage(resource.mdImage.deleteHash), 
                    Imgur.deleteImage(resource.smImage.deleteHash),
                    findOneAndRemove(data.id),
                    CollectionService.deleteResourceFromCollection2({username: resource.username, resourceId: data.id})
                ]);
                
                return {
                    message: {
                        error: false,
                        status: 200
                    }
                }
            }  else {
                return {
                    error: 'Resource not found'
                }
            }
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const findOneAndRemove = async (data) => {
        try {
            const response = await _Resource.findOneAndRemove({
                _id: data
            }).exec();
            
            if (response) {
                return true;
            }
        } catch (err) {
            return {
                error: err.message
            }
        }
    }

    const deleteImgurImageFromResource = async (data) => {
        try {
            await Imgur.deleteImage(data.deleteHash);
            const query = {
                _id: _id
            };
            const update = {
                $set: {
                    deleteHash: null
                },
                safe: {
                    new: true,
                    upsert: true
                }
            };
            await _Resource.updateOne(query, update).exec();
            return true
        } catch (err) {
            return false
        }
    }

    return {
        deleteResource,
        deleteImgurImageFromResource
    }
})()

module.exports = DeleteResource;