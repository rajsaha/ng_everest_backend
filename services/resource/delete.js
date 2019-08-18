const _Resource = require('../../models/Resource');
const Imgur = require('../imgur/imgur');

const DeleteResource = (() => {
    const deleteResource = async (data) => {
        try {
            const resource = await _Resource.findById(data.id).exec();
            // TODO: Delete resource from all collections
            if (resource && resource.deleteHash) {
                // Delete image from imgur
                await Imgur.deleteImage(resource.deleteHash);
                await _Resource.findOneAndRemove({
                    _id: data.id
                }).exec();
                return {
                    message: {
                        error: false,
                        status: 200
                    }
                }
            } else if (resource) {
                await _Resource.findOneAndRemove({
                    _id: data.id
                }).exec();
                return {
                    message: {
                        error: false,
                        status: 200
                    }
                }
            } else {
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