// Models
const User = require("../../models/User");
const Resource = require("../../models/Resource");
const Following = require("../../models/Following");
const Follower = require("../../models/Follower");
const Recommend = require("../../models/Recommend");

// Services
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const ResourceService = require("../resource/get");
const CollectionService = require("../collection/collection");
const Imgur = require("../imgur/imgur");
const bcryptjs = require("bcryptjs");
const selectFields =
  "firstName lastName username smImage.link mdImage.link xsImage.link";

const Profile = (() => {
  const getUserId = async (username) => {
    try {
      const user = await User.findOne({
        username: username
      }).exec();
      let id = null;
      if (user) {
        id = user._id;
      }

      return id;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };
  const getUserData = async (data) => {
    try {
      const user = await User.aggregate([{
          $lookup: {
            from: "followers",
            localField: "_id",
            foreignField: "anchorUserId",
            as: "follower",
          },
        },
        {
          $lookup: {
            from: "followings",
            localField: "_id",
            foreignField: "anchorUserId",
            as: "following",
          },
        },
        {
          $lookup: {
            from: "collections",
            localField: "_id",
            foreignField: "anchorUserId",
            as: "collection",
          },
        },
        {
          $match: {
            _id: ObjectId(data.userId),
          },
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            username: 1,
            email: 1,
            mdImage: {
              $ifNull: ["$mdImage", ""],
            },
            smImage: {
              $ifNull: ["$smImage", ""],
            },
            bio: {
              $ifNull: ["$bio", ""],
            },
            website: {
              $ifNull: ["$website", ""],
            },
            followingCount: {
              $size: {
                $cond: [{
                  $isArray: "$following"
                }, "$following", []],
              },
            },
            followerCount: {
              $size: {
                $cond: [{
                  $isArray: "$follower"
                }, "$follower", []],
              },
            },
            collectionCount: {
              $size: {
                $cond: [{
                  $isArray: "$collection"
                }, "$collection", []],
              },
            },
            following: {
              $slice: ["$following", 0, 4],
            },
            followers: {
              $slice: ["$follower", 0, 4],
            },
            interests: 1,
          },
        },
      ]).exec();

      const userResourceTypeCountObj = await getUserResourceTypeCount(
        data.userId
      );

      // * Get followers images
      let followers = user[0].followers ? user[0].followers : [];
      let followerIds = [];

      for (let item of followers) {
        if (!item.anchorUserId.equals(item.userId)) {
          followerIds.push(item.userId);
        }
      }

      const followerObjects = await User.aggregate([{
          $match: {
            _id: {
              $in: [...followerIds]
            },
          },
        },
        {
          $project: {
            smImage: {
              $ifNull: ["$smImage.link", ""],
            },
            username: 1,
            firstName: 1,
            lastName: 1,
          },
        },
      ]);

      // * Check if logged in user is following param user
      const isLoggedInUserFollowingParamUser = await Following.find({
        userId: ObjectId(data.userId),
        anchorUserId: ObjectId(data.loggedInUserId),
      }).countDocuments();

      return {
        userData: user[0],
        articleCount: userResourceTypeCountObj.articleCount,
        extContentCount: userResourceTypeCountObj.extContentCount,
        followerObjects: followerObjects,
        isLoggedInUserFollowingParamUser,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getUserResourceTypeCount = async (userId) => {
    try {
      const resources = await Resource.find({
          userId: userId
        })
        .select("type")
        .exec();

      let articleCount = 0;
      let extContentCount = 0;

      for (let resource of resources) {
        if (resource.type === "article") {
          articleCount++;
        }

        if (resource.type === "ext-content") {
          extContentCount++;
        }
      }

      return {
        articleCount,
        extContentCount,
      };
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        error: error.message,
      };
    }
  };

  const getPublicProfile = async (data) => {
    try {
      const userId = await getUserId(data.username);
      const result = await Promise.all([
        getProfileData(userId),
        CollectionService.getCollections(data.username),
      ]);

      return {
        profileData: result[0],
        userCollections: result[1],
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const updateProfileData = async (data) => {
    try {
      const _id = data.id;
      const firstName = data.firstName ? data.firstName : "";
      const lastName = data.lastName ? data.lastName : "";
      const website = data.website || "";
      const bio = data.bio || "";
      const email = data.email || "";
      const interests = data.interests || [];

      const query = {
        _id: _id,
      };
      const update = {
        $set: {
          firstName: firstName,
          lastName: lastName,
          website: website,
          bio: bio,
          email: email,
        },
        $addToSet: {
          interests: {
            $each: interests,
          },
        },
        safe: {
          new: true,
          upsert: true,
        },
      };

      const user = await User.updateOne(query, update).exec();
      return {
        message: "User details updated",
      };
    } catch (err) {
      console.log(err);
      return {
        error: err.message,
      };
    }
  };

  const removeInterest = async (data) => {
    try {
      const user = await User.updateOne({
        _id: data.id,
      }, {
        $pull: {
          interests: data.interest,
        },
      }).exec();
      return {
        message: `${data.interest} removed`,
      };
    } catch (err) {
      console.log(err);
      return {
        error: err.message,
      };
    }
  };

  const saveProfilePhoto = async (id, data, username) => {
    try {
      // * Delete current image if any and save new image
      const response = await Promise.all([
        deleteCurrentUserImage(username),
        Imgur.saveImage(data, 600),
        Imgur.saveImage(data, 200),
        Imgur.saveImage(data, 50),
        Imgur.saveImage(data, 20),
      ]);
      const sprLG = response[1];
      const sprMD = response[2];
      const sprSM = response[3];
      const sprXS = response[4];

      const query = {
        _id: id,
      };

      const update = {
        $set: {
          lgImage: {
            link: sprLG.data.data.link,
            id: sprLG.data.data.id,
            deleteHash: sprLG.data.data.deletehash,
          },
          mdImage: {
            link: sprMD.data.data.link,
            id: sprMD.data.data.id,
            deleteHash: sprMD.data.data.deletehash,
          },
          smImage: {
            link: sprSM.data.data.link,
            id: sprSM.data.data.id,
            deleteHash: sprSM.data.data.deletehash,
          },
          xsImage: {
            link: sprXS.data.data.link,
            id: sprXS.data.data.id,
            deleteHash: sprXS.data.data.deletehash,
          },
        },
        safe: {
          new: true,
          upsert: true,
        },
      };

      await User.updateOne(query, update).exec();
      return {
        error: false,
        lgImage: {
          id: sprLG.data.data.id,
          deleteHash: sprLG.data.data.deletehash,
          link: sprLG.data.data.link,
        },
        mdImage: {
          id: sprMD.data.data.id,
          deleteHash: sprMD.data.data.deletehash,
          link: sprMD.data.data.link,
        },
        smImage: {
          id: sprSM.data.data.id,
          deleteHash: sprSM.data.data.deletehash,
          link: sprSM.data.data.link,
        },
        xsImage: {
          id: sprXS.data.data.id,
          deleteHash: sprXS.data.data.deletehash,
          link: sprXS.data.data.link,
        },
      };
    } catch (err) {
      console.log(err);
      return {
        error: err.message,
      };
    }
  };

  const deleteProfilePhoto = async (id) => {
    try {
      const user = await User.findById(id)
        .select("lgImage mdImage smImage xsImage")
        .exec();

      // * Delete profile photos (different sizes)
      await Promise.all([
        Imgur.deleteImage(user.lgImage.deleteHash),
        Imgur.deleteImage(user.mdImage.deleteHash),
        Imgur.deleteImage(user.smImage.deleteHash),
        Imgur.deleteImage(user.xsImage.deleteHash),
      ]);

      const query = {
        _id: id,
      };

      const update = {
        $set: {
          lgImage: {
            link: null,
            id: null,
            deleteHash: null,
          },
          mdImage: {
            link: null,
            id: null,
            deleteHash: null,
          },
          smImage: {
            link: null,
            id: null,
            deleteHash: null,
          },
          xsImage: {
            link: null,
            id: null,
            deleteHash: null,
          },
        },
        safe: {
          new: true,
          upsert: true,
        },
      };

      await User.updateOne(query, update).exec();
      console.log(`Image deleted`);
      return {
        message: {
          error: false,
          status: 200,
        },
      };
    } catch (err) {
      console.log(err);
      return {
        error: err.message,
      };
    }
  };

  const getProfilePhoto = async (username) => {
    try {
      const user = await User.findOne({
          username: username,
        })
        .select("mdImage")
        .exec();
      return {
        mdImage: user.mdImage,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const changePassword = async (data) => {
    try {
      const user = await User.findOne({
        username: data.username,
      }).exec();

      // * If no username found
      if (!user) {
        return {
          status: 404,
          error: "The username does not exist",
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
            password: newPassword,
          },
          safe: {
            new: true,
            upsert: true,
          },
        };

        await User.updateOne({
            username: data.username,
          },
          update
        ).exec();
        return {
          error: false,
          status: 200,
          message: "Password updated",
        };
      } else {
        return {
          status: 400,
          error: "Username/password invalid",
        };
      }
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const deleteCurrentUserImage = async (username) => {
    try {
      // * Get user image
      const user = await User.findOne({
          username,
        })
        .select("lgImage mdImage smImage xsImage")
        .exec();

      if (user && user.lgImage) {
        // * Delete image from imgur
        await Promise.all([
          Imgur.deleteImage(user.lgImage.deleteHash),
          Imgur.deleteImage(user.mdImage.deleteHash),
          Imgur.deleteImage(user.smImage.deleteHash),
          Imgur.deleteImage(user.xsImage.deleteHash),
        ]);

        return true;
      }

      return false;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  // * Functions related to liking and unliking posts
  const likePost = async (data) => {
    try {
      const recommend = new Recommend({
        resourceId: data.resourceId,
        userId: data.userId,
      });

      const response = await Promise.all([
        recommend.save(),
        incrementResourceLikeCount(data.resourceId),
      ]);

      if (response[0] && response[1]) {
        return true;
      }
      return false;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const unlikePost = async (data) => {
    try {
      const unlikeAction = Recommend.deleteOne({
        resourceId: data.resourceId,
        userId: data.userId,
      });
      const response = await Promise.all([
        unlikeAction.exec(),
        decrementResourceLikeCount(data.resourceId),
      ]);
      if (response[0] && response[1]) {
        return true;
      }
      return false;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const incrementResourceLikeCount = async (resourceId) => {
    try {
      const query = {
        _id: resourceId,
      };

      const update = {
        $inc: {
          recommended_by_count: 1,
        },
      };

      const response = await Resource.findOneAndUpdate(query, update);
      if (response) {
        return true;
      }

      return false;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const decrementResourceLikeCount = async (resourceId) => {
    try {
      const query = {
        _id: resourceId,
      };

      const update = {
        $inc: {
          recommended_by_count: -1,
        },
      };

      const response = await Resource.findOneAndUpdate(query, update);
      if (response) {
        return true;
      }

      return false;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const checkIfPostIsLiked = async (data) => {
    try {
      const response = await Recommend.find({
        userId: data.userId,
        resourceId: data.resourceId,
      });
      if (response.length > 0) {
        return true;
      }

      return false;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };
  // ! End of functions related to liking and unliking posts

  // * Functions related to following and unfollowing users
  const followUser = async (data) => {
    try {
      const following = new Following({
        anchorUserId: data.anchorUserId,
        userId: data.userId,
      });

      const follower = new Follower({
        anchorUserId: data.userId,
        userId: data.anchorUserId,
      });

      await Promise.all([following.save(), follower.save()]);

      return true;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const unfollowUser = async (data) => {
    try {
      await Following.findOneAndDelete({
        anchorUserId: data.anchorUserId,
        userId: data.userId,
      });

      return true;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const checkIfUserIsFollowed = async (data) => {
    try {
      const response = await Following.find({
        anchorUserId: data.anchorUserId,
        userId: data.userId,
      });
      if (response.length > 0) {
        return true;
      }

      return false;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getUserFollowers = async (username) => {
    try {
      const following = await User.findOne({
          username
        })
        .select("following")
        .exec();
      if (following) {
        return {
          following,
        };
      }
      return false;
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getFollowersFollowing = async (data) => {
    try {
      const followers = await Follower.aggregate([{
          $match: {
            anchorUserId: ObjectId(data.userId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "users",
          },
        },
        {
          $project: {
            _id: 1,
            followers: {
              $map: {
                input: "$users",
                as: "user",
                in: {
                  id: "$$user._id",
                  username: "$$user.username",
                  firstName: "$$user.firstName",
                  lastName: "$$user.lastName",
                  image: "$$user.smImage.link",
                },
              },
            },
          },
        },
      ]).exec();

      const followings = await Following.aggregate([{
          $match: {
            anchorUserId: ObjectId(data.userId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "users",
          },
        },
        {
          $project: {
            _id: 1,
            followings: {
              $map: {
                input: "$users",
                as: "user",
                in: {
                  id: "$$user._id",
                  username: "$$user.username",
                  firstName: "$$user.firstName",
                  lastName: "$$user.lastName",
                  image: "$$user.smImage.link",
                },
              },
            },
          },
        },
      ]).exec();

      return {
        error: false,
        data: {
          followers,
          followings,
        },
      };
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        error: error.message,
      };
    }
  };

  // ! End of functions related to following and unfollowing users

  const globalUserSearch = async (query, options) => {
    try {
      // ! If user isn't selected
      if (!options.user) {
        return;
      }
      const users = await User.aggregate([{
          $match: {
            $or: [{
                firstName: {
                  $regex: query,
                  $options: "i"
                }
              },
              {
                lasttName: {
                  $regex: query,
                  $options: "i"
                }
              },
              {
                username: {
                  $regex: query,
                  $options: "i"
                }
              },
            ],
          },
        },
        {
          $sort: {
            timestamp: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            username: 1,
            image: "$mdImage.link",
            timestamp: 1,
          },
        },
      ]).exec();

      return {
        users,
      };
    } catch (err) {
      console.error(err);
      return {
        error: err.message,
      };
    }
  };

  const globalSearch = async (data) => {
    try {
      const ifTagSerach = data.query.includes("%23") ? true : false;
      const query = decodeURIComponent(data.query);
      const options = data.options;

      // Resource only
      if (ifTagSerach) {
        const searchResult = await ResourceService.searchResources(
          query,
          options
        );
        return {
          resourceOnly: true,
          resources: searchResult,
        };
      }

      // All types
      const searchResult = await Promise.all([
        globalUserSearch(query, options),
        ResourceService.searchResources(query, options),
        CollectionService.searchCollections(query, options),
      ]);

      return {
        resourceOnly: false,
        users: searchResult[0],
        resources: searchResult[1],
        collections: searchResult[2],
      };
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        error: error.message,
      };
    }
  };

  const getUserInterests = async (data) => {
    try {
      const user = await User.findById(ObjectId(data.userId)).select("interests").exec();

      return {
        user
      }
    } catch (err) {
      return {
        error: err.message,
      };
    }
  }

  const setUserInterests = async (data) => {
    try {
      const _id = data.id;
      const interests = data.interests || [];

      const query = {
        _id: _id,
      };
      const update = {
        $set: {
          interests: interests
        },
        safe: {
          new: true,
          upsert: true,
        },
      };

      const user = await User.updateOne(query, update).exec();
      return {
        message: "User details updated",
      };
    } catch (err) {
      console.log(err);
      return {
        error: err.message,
      };
    }
  }

  return {
    getUserId,
    getUserData,
    updateProfileData,
    removeInterest,
    saveProfilePhoto,
    deleteProfilePhoto,
    getProfilePhoto,
    changePassword,
    likePost,
    unlikePost,
    checkIfPostIsLiked,
    getPublicProfile,
    followUser,
    unfollowUser,
    checkIfUserIsFollowed,
    getUserFollowers,
    globalSearch,
    getFollowersFollowing,
    getUserInterests,
    setUserInterests
  };
})();

module.exports = Profile;