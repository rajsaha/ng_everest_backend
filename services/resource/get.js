const _Resource = require('../../models/Resource');
const User = require('../../models/User');
const mongoose = require('mongoose');

const ResourceGet = (() => {
    const getAllResources = async () => {
        try {
            const resources = await _Resource.find().sort({timestamp: -1}).exec();
            return {
                resources: resources
            }
        } catch (err) {
            return {
                error: err.message
            }
        }
    }

    const getUserResources = async (username) => {
        try {
            const resources = await _Resource.find({username}).sort({timestamp: -1}).exec();
            return {
                resources: resources
            }
        } catch (err) {
            return {
                error: err.message
            }
        }
    }

    const getResource = async (data) => {
        try {
            const resource = await _Resource.findById(data).exec();
            return {
                resource: resource
            }
        } catch (err) {
            return {
                error: err.message
            }
        }
    }

    const getMultipleResources = async (data) => {
        try {
            const getQueries = (data) => {
                let mongooseQueryArray = [];
                for (let resourceId of data) {
                    mongooseQueryArray.push(mongoose.Types.ObjectId(resourceId));
                }
                return mongooseQueryArray;
            }
        
            const resources = await _Resource.find({
                '_id': { $in: [
                    ...getQueries(data)
                ]}
            }).exec();
            return {
                resources
            }
        } catch (err) {
            return {
                error: err.message
            }
        }
    }

    const getFourImages = async (data) => {
        try {
            let images = [];
            let promises = [];
            for (let item of data) {
                promises.push(getResourceImage(item));
            }
            images = await Promise.all(promises);
            return {
                images
            }
        } catch (err) {
            return {
                error: err.message
            }
        }
    }

    function getResourceImage(resourceId) {
        return new Promise((resolve, reject) => {
            const result = _Resource.findById(resourceId).select('image').exec();
            resolve(result);
        });
    }

    const getProfileImageByUsername = async (username) => {
        try {
            const user = await User.findOne({username}).select('image').exec();
            return { image: user.image.link }
        } catch (err) {
            return {
                error: err.message
            }
        }
    }

    return {
        getAllResources,
        getUserResources,
        getResource,
        getMultipleResources,
        getFourImages,
        getProfileImageByUsername
    }
})()

module.exports = ResourceGet;