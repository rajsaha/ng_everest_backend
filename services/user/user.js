const User = require('../../models/User');
const Resource = require('../../models/Resource');
const Imgur = require('../imgur/imgur');
const axios = require('axios');
const bcryptjs = require('bcryptjs');

const Profile = (() => {
    const getProfileData = async (username) => {
        try {
            const user = await User.findOne({
                username: username
            }, {
                'password': 0
            }).exec();
            return {
                userData: user
            }
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const updateProfileData = async (data) => {
        const _id = data.id;
        const name = data.name || '';
        const website = data.website || '';
        const bio = data.bio || '';
        const email = data.email || '';
        const interests = data.interests || [];

        const query = {
            _id: _id
        };
        const update = {
            $set: {
                name: name,
                website: website,
                bio: bio,
                email: email,
            },
            $addToSet: {
                interests: {
                    $each: interests
                }
            },
            safe: {
                new: true,
                upsert: true
            }
        };

        try {
            const user = await User.updateOne(query, update).exec();
            return {
                message: 'User details updated',
            }
        } catch (err) {
            console.log(err);
            return {
                error: err.message
            };
        }
    }

    const removeInterest = async (data) => {
        try {
            const user = await User.updateOne({
                _id: data.id
            }, {
                $pull: {
                    interests: data.interest
                }
            }).exec();
            return {
                message: `${data.interest} removed`
            }
        } catch (err) {
            console.log(err);
            return {
                error: err.message
            };
        }
    }

    const saveProfilePhoto = async (id, data, username) => {
        try {
            // * Delete current image if any and save new image
            const response = await Promise.all([deleteCurrentUserImage(username), Imgur.saveImage(data)]);
            const savePhotoResponse = response[1];

            const query = {
                _id: id
            };

            const update = {
                $set: {
                    image: {
                        link: savePhotoResponse.data.data.link,
                        id: savePhotoResponse.data.data.id,
                        deleteHash: savePhotoResponse.data.data.deletehash
                    }
                },
                safe: {
                    new: true,
                    upsert: true
                }
            };

            await User.updateOne(query, update).exec();
            return {
                message: {
                    error: false,
                    status: 200,
                    data: {
                        id: savePhotoResponse.data.data.id,
                        deleteHash: savePhotoResponse.data.data.deletehash,
                        link: savePhotoResponse.data.data.link
                    }
                }
            };
        } catch (err) {
            console.log(err);
            return {
                error: err.message
            };
        }
    }

    const deleteProfilePhoto = async (id, deleteHash) => {
        try {
            const deletePhoto = axios.create({
                headers: {
                    'Authorization': `Client-ID ${process.env.CLIENT_ID}`
                }
            });

            await deletePhoto.delete(`${process.env.IMAGE_DELETE_URL}/${deleteHash}`);

            const query = {
                _id: id
            };

            const update = {
                $set: {
                    image: {
                        link: null,
                        id: null,
                        deleteHash: null
                    }
                },
                safe: {
                    new: true,
                    upsert: true
                }
            };

            await User.updateOne(query, update).exec();
            console.log(`Image deleted`);
            return {
                message: {
                    error: false,
                    status: 200
                }
            };
        } catch (err) {
            console.log(err);
            return {
                error: err.message
            };
        }
    }

    const getProfilePhoto = async (username) => {
        try {
            const user = await User.findOne({
                username: username
            }).select('image').exec();
            return {
                image: user
            }
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const changePassword = async (data) => {
        try {
            const user = await User.findOne({
                username: data.username
            }).exec();

            // * If no username found
            if (!user) {
                return {
                    status: 404,
                    error: "The username does not exist"
                };
            }

            // * Compare plaintext password with hash
            const match = user.comparePassword(data.currentPass, (error, match) => {
                return match;
            });

            if (match) {
                let newPassword = bcryptjs.hashSync(data.password, 10);
                const update = {
                    $set: {
                        password: newPassword
                    },
                    safe: {
                        new: true,
                        upsert: true
                    }
                };

                await User.updateOne({
                    username: data.username
                }, update).exec();
                return {
                    error: false,
                    status: 200,
                    message: 'Password updated'
                }
            } else {
                return {
                    status: 400,
                    error: 'Username/password invalid'
                }
            }
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const deleteCurrentUserImage = async (username) => {
        try {
            // * Get user image
            const user = await User.findOne({
                username
            }).select('image').exec();

            if (user && user.image) {
                // * Delete image from imgur
                await Imgur.deleteImage(user.image.deleteHash);
                return true;
            }

            return false;
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const likePost = async (data) => {
        try {
            const query = {
                username: data.username
            };
            const update = {
                $push: {
                    recommends: data.resourceId
                },
                safe: {
                    new: true,
                    upsert: true
                }
            };

            const response = await User.findOneAndUpdate(query, update).exec();
            const response2 = await incrementResourceLikeCount(data.resourceId);
            if (response && response2) {
                return true;
            }
            return false;
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const incrementResourceLikeCount = async (resourceId) => {
        try {
            const query = {
                _id: resourceId
            };

            const update = {
                $inc: {
                    recommended_by_count: 1
                }
            };

            const response = await Resource.findOneAndUpdate(query, update);
            if (response) {
                return true;
            }

            return false;
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const unlikePost = async (data) => {
        try {
            const response = await User.updateOne({
                username: data.username
            }, {
                $pull: {
                    recommends: data.resourceId
                }
            }).exec();
            const response2 = await decrementResourceLikeCount(data.resourceId);
            if (response && response2) {
                return true;
            }
            return false;
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const decrementResourceLikeCount = async (resourceId) => {
        try {
            const query = {
                _id: resourceId
            };

            const update = {
                $inc: {
                    recommended_by_count: -1
                }
            };

            const response = await Resource.findOneAndUpdate(query, update);
            if (response) {
                return true;
            }

            return false;
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    const checkIfPostIsLiked = async (data) => {
        try {
            const response = await User.find({username: data.username, recommends: data.resourceId});
            if (response.length > 0) {
                return true;
            }

            return false;
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    return {
        getProfileData,
        updateProfileData,
        removeInterest,
        saveProfilePhoto,
        deleteProfilePhoto,
        getProfilePhoto,
        changePassword,
        likePost,
        unlikePost,
        checkIfPostIsLiked
    }
})();

module.exports = Profile;