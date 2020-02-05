const User = require("../../models/User");
const Resource = require("../../models/Resource");
const ResourceService = require("../resource/get");
const CollectionService = require("../collection/collection");
const Imgur = require("../imgur/imgur");
const bcryptjs = require("bcryptjs");
const selectFields = "name username smImage.link";

const Profile = (() => {
  const getProfileData = async username => {
    try {
      const user = await User.findOne(
        {
          username: username
        },
        {
          password: 0
        }
      ).exec();
      return {
        userData: user
      };
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const getPublicProfile = async data => {
    try {
      const result = await Promise.all([
        getProfileData(data.username),
        CollectionService.getCollections(data.username)
      ]);

      return {
        profileData: result[0],
        userCollections: result[1]
      };
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const updateProfileData = async data => {
    const _id = data.id;
    const name = data.name || "";
    const website = data.website || "";
    const bio = data.bio || "";
    const email = data.email || "";
    const interests = data.interests || [];

    const query = {
      _id: _id
    };
    const update = {
      $set: {
        name: name,
        website: website,
        bio: bio,
        email: email
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
        message: "User details updated"
      };
    } catch (err) {
      console.log(err);
      return {
        error: err.message
      };
    }
  };

  const removeInterest = async data => {
    try {
      const user = await User.updateOne(
        {
          _id: data.id
        },
        {
          $pull: {
            interests: data.interest
          }
        }
      ).exec();
      return {
        message: `${data.interest} removed`
      };
    } catch (err) {
      console.log(err);
      return {
        error: err.message
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
        Imgur.saveImage(data, 20)
      ]);
      const sprLG = response[1];
      const sprMD = response[2];
      const sprSM = response[3];
      const sprXS = response[4];

      const query = {
        _id: id
      };

      const update = {
        $set: {
          lgImage: {
            link: sprLG.data.data.link,
            id: sprLG.data.data.id,
            deleteHash: sprLG.data.data.deletehash
          },
          mdImage: {
            link: sprMD.data.data.link,
            id: sprMD.data.data.id,
            deleteHash: sprMD.data.data.deletehash
          },
          smImage: {
            link: sprSM.data.data.link,
            id: sprSM.data.data.id,
            deleteHash: sprSM.data.data.deletehash
          },
          xsImage: {
            link: sprXS.data.data.link,
            id: sprXS.data.data.id,
            deleteHash: sprXS.data.data.deletehash
          }
        },
        safe: {
          new: true,
          upsert: true
        }
      };

      await User.updateOne(query, update).exec();
      return {
        error: false,
        lgImage: {
          id: sprLG.data.data.id,
          deleteHash: sprLG.data.data.deletehash,
          link: sprLG.data.data.link
        },
        mdImage: {
          id: sprMD.data.data.id,
          deleteHash: sprMD.data.data.deletehash,
          link: sprMD.data.data.link
        },
        smImage: {
          id: sprSM.data.data.id,
          deleteHash: sprSM.data.data.deletehash,
          link: sprSM.data.data.link
        },
        xsImage: {
          id: sprXS.data.data.id,
          deleteHash: sprXS.data.data.deletehash,
          link: sprXS.data.data.link
        }
      };
    } catch (err) {
      console.log(err);
      return {
        error: err.message
      };
    }
  };

  const deleteProfilePhoto = async id => {
    try {
      const user = await User.findById(id)
        .select("lgImage mdImage smImage xsImage")
        .exec();

      // * Delete profile photos (different sizes)
      await Promise.all([
        Imgur.deleteImage(user.lgImage.deleteHash),
        Imgur.deleteImage(user.mdImage.deleteHash),
        Imgur.deleteImage(user.smImage.deleteHash),
        Imgur.deleteImage(user.xsImage.deleteHash)
      ]);  

      const query = {
        _id: id
      };

      const update = {
        $set: {
          lgImage: {
            link: null,
            id: null,
            deleteHash: null
          },
          mdImage: {
            link: null,
            id: null,
            deleteHash: null
          },
          smImage: {
            link: null,
            id: null,
            deleteHash: null
          },
          xsImage: {
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
  };

  const getProfilePhoto = async username => {
    try {
      const user = await User.findOne({
        username: username
      })
        .select("mdImage")
        .exec();
      return {
        mdImage: user.mdImage
      };
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const changePassword = async data => {
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

        await User.updateOne(
          {
            username: data.username
          },
          update
        ).exec();
        return {
          error: false,
          status: 200,
          message: "Password updated"
        };
      } else {
        return {
          status: 400,
          error: "Username/password invalid"
        };
      }
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const deleteCurrentUserImage = async username => {
    try {
      // * Get user image
      const user = await User.findOne({
        username
      })
        .select("lgImage mdImage smImage xsImage")
        .exec();

      if (user && user.lgImage) {
        // * Delete image from imgur
        await Promise.all([
          Imgur.deleteImage(user.lgImage.deleteHash),
          Imgur.deleteImage(user.mdImage.deleteHash),
          Imgur.deleteImage(user.smImage.deleteHash),
          Imgur.deleteImage(user.xsImage.deleteHash)
        ]);

        return true;
      }

      return false;
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  // * Functions related to liking and unliking posts
  const likePost = async data => {
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

      const response = await Promise.all([
        User.findOneAndUpdate(query, update).exec(),
        incrementResourceLikeCount(data.resourceId)
      ]);

      if (response[0] && response[1]) {
        return true;
      }
      return false;
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const incrementResourceLikeCount = async resourceId => {
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
  };

  const unlikePost = async data => {
    try {
      const response = await Promise.all([
        User.updateOne(
          { username: data.username },
          { $pull: { recommends: data.resourceId } }
        ).exec(),
        decrementResourceLikeCount(data.resourceId)
      ]);
      if (response[0] && response[1]) {
        return true;
      }
      return false;
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const decrementResourceLikeCount = async resourceId => {
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
  };

  const checkIfPostIsLiked = async data => {
    try {
      const response = await User.find({
        username: data.username,
        recommends: data.resourceId
      });
      if (response.length > 0) {
        return true;
      }

      return false;
    } catch (err) {
      return {
        error: err.message
      };
    }
  };
  // ! End of functions related to liking and unliking posts

  // * Functions related to following and unfollowing users
  const followUser = async data => {
    try {
      const query = {
        username: data.currentUser
      };
      const update = {
        $push: {
          following: data.username
        },
        safe: {
          new: true,
          upsert: true
        }
      };

      const query2 = {
        username: data.username
      };

      const update2 = {
        $push: {
          followers: data.currentUser
        },
        safe: {
          new: true,
          upsert: true
        }
      };

      const response = await Promise.all([
        User.findOneAndUpdate(query, update).exec(),
        User.findOneAndUpdate(query2, update2).exec()
      ]);

      if (response[0] && response[1]) {
        return true;
      }
      return false;
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const unfollowUser = async data => {
    try {
      const query = {
        username: data.currentUser
      };
      const update = {
        $pull: {
          following: data.username
        },
        safe: {
          new: true,
          upsert: true
        }
      };

      const query2 = {
        username: data.username
      };

      const update2 = {
        $pull: {
          followers: data.currentUser
        },
        safe: {
          new: true,
          upsert: true
        }
      };

      const response = await Promise.all([
        User.findOneAndUpdate(query, update).exec(),
        User.findOneAndUpdate(query2, update2).exec()
      ]);

      if (response[0] && response[1]) {
        return true;
      }
      return false;
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const checkIfUserIsFollowed = async data => {
    try {
      const response = await User.find({
        username: data.currentUser,
        following: data.username
      });
      if (response.length > 0) {
        return true;
      }

      return false;
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const getUserFollowers = async username => {
    try {
      const following = await User.findOne({ username })
        .select("following")
        .exec();
      if (following) {
        return {
          following
        };
      }
      return false;
    } catch (err) {
      return {
        error: err.message
      };
    }
  };

  const globalUserSearch = async (query, options) => {
    try {
      // ! If user isn't selected
      if (!options.user) {
        return;
      }
      const users = await User.find(
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { username: { $regex: query, $options: "i" } }
          ]
        },
        selectFields
      )
        .limit(10)
        .exec();

      return {
        users
      };
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        error: error.message
      };
    }
  };

  const globalSearch = async data => {
    try {
      const query = decodeURIComponent(data.query);
      const options = data.options;

      // Resource only
      if (query.charAt(0) === "#") {
        const searchResult = await ResourceService.searchResources(
          query,
          options
        );
        return {
          resourceOnly: true,
          resources: searchResult.resources
        };
      }

      // All types
      const searchResult = await Promise.all([
        globalUserSearch(query, options),
        ResourceService.searchResources(query, options),
        CollectionService.searchCollections(query, options)
      ]);

      return {
        resourceOnly: false,
        users: searchResult[0],
        resources: searchResult[1],
        collections: searchResult[2]
      };
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        error: error.message
      };
    }
  };

  const getFollowersFollowing = async username => {
    try {
      let followersFollowing = {
        followers: [],
        following: []
      };
      const currentUser = await User.findOne({ username })
        .select("followers following")
        .exec();
      for (const user of currentUser.followers) {
        if (user !== username) {
          let temp = await User.findOne({ username: user })
            .select("name username image")
            .exec();
          followersFollowing.followers.push(temp);
        }
      }

      for (const user of currentUser.following) {
        if (user !== username) {
          let temp = await User.findOne({ username: user })
            .select("name username image")
            .exec();
          followersFollowing.following.push(temp);
        }
      }

      return followersFollowing;
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        error: error.message
      };
    }
  };

  // ! End of functions related to following and unfollowing users

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
    checkIfPostIsLiked,
    getPublicProfile,
    followUser,
    unfollowUser,
    checkIfUserIsFollowed,
    getUserFollowers,
    globalSearch,
    getFollowersFollowing
  };
})();

module.exports = Profile;
