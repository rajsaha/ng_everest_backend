const _Resource = require('../../models/Resource');
const User = require('../../models/User');
const mongoose = require('mongoose');
const selectFields = '_id username title description image url timestamp tags';

const ResourceGet = (() => {
    const getAllResources = async (data) => {
        try {
            const followers = await getUserFollowers(data.username);
            // const resources = await _Resource.find().skip(parseInt(start)).limit(parseInt(end)).sort({timestamp: -1}).exec();
            const resources = await _Resource.find({
                'username': { $in: [
                    ...followers.following.following
                ]}
            }).sort({timestamp: -1}).exec();
            return {
                resources: resources
            }
        } catch (err) {
            return {
                error: err.message
            }
        }
    }

    const getUserFollowers = async (username) => {
        try {
            const following = await User.findOne({username}).select('following').exec();
            if (following) {
                return {
                    following
                }
            }
            return false;
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const getUserResources = async (username) => {
        try {
            const resources = await _Resource.find({username}, 
                {
                    comments: 0, 
                    deleteHash: 0, 
                    recommended_by: 0, 
                    recommended_by_count: 0
                }).sort({timestamp: -1}).exec();
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

    const searchResources = async (query) => {
        try {
            if (query.charAt(0) === "#") {
                const sansHash = query.replace('#', '');
                const regex = [new RegExp(sansHash, 'i')];
                // * Search for resources with tag
                const resources = await _Resource.find({tags: { $in: regex }}, selectFields).limit(10).exec();
                return {
                    resources
                }
            }

            const resources = await _Resource.find({title: {$regex: `${query}`, $options: 'i'}}, selectFields).limit(10).exec();
            return {
                resources
            }
        } catch (err) {
            return {
                error: err.message
            }
        }
    }

    const searchUserResources = async (data) => {
        try {
            let query = data.query;
            if (query.charAt(0) === "#") {
                const sansHash = query.replace('#', '');
                const regex = [new RegExp(sansHash, 'i')];
                // * Search for resources with tag
                const resources = await _Resource.find(
                    {
                        username: data.username, 
                        tags: { $in: regex }
                    }, selectFields).exec();
                return {
                    resources
                }
            }

            const resources = await _Resource.find(
                {
                    username: data.username, 
                    title: {$regex: `${query}`, $options: 'i'}
                }, selectFields).exec();
            return {
                resources
            }
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
        getResourceImage,
        getFourImages,
        getProfileImageByUsername,
        searchUserResources,
        searchResources
    }
})()

module.exports = ResourceGet;