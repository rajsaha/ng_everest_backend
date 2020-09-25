// Models
const mongoose = require("mongoose");
const _Resource = require("../../models/Resource");
const User = require("../../models/User");
const Following = require("../../models/Following");
const Comment = require("../../models/Comment");

const ObjectId = mongoose.Types.ObjectId;

const selectFields =
  "_id username title description smImage.link url timestamp tags recommended_by_count type";

const ResourceGet = (() => {
  const getAllResources = async (data) => {
    try {
      // Get users that current logged in user follows
      const following = await getUserFollowers(data.userId);
      let followingArray = [];

      for (let user of following.following) {
        followingArray.push(ObjectId(user.userId));
      }

      // Set up pagination
      const pageNo = parseInt(data.pageNo);
      const size = parseInt(data.size);
      let query = {};
      if (pageNo < 0 || pageNo === 0) {
        return {
          error: "Invalid page number",
        };
      }
      query.skip = size * (pageNo - 1);
      query.limit = size;
      query.userIds = {
        $in: [...followingArray],
      };

      const resources = await _Resource
        .aggregate([
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $facet: {
              resources: [
                {
                  $sort: {
                    timestamp: -1,
                  },
                },
                {
                  $match: {
                    userId: query.userIds,
                  },
                },
                {
                  $project: {
                    _id: 1,
                    username: "$user.username",
                    userImage: "$user.smImage.link",
                    firstName: "$user.firstName",
                    lastName: "$user.lastName",
                    url: 1,
                    title: 1,
                    type: 1,
                    tags: 1,
                    description: 1,
                    lgImage: 1,
                    smImage: 1,
                    deleteHash: 1,
                    timestamp: 1,
                    recommended_by_count: 1,
                  },
                },
                {
                  $skip: query.skip,
                },
                {
                  $limit: query.limit,
                },
              ],
              count: [
                {
                  $match: {
                    userId: query.userIds,
                  },
                },
                {
                  $group: {
                    _id: 0,
                    count: { $sum: 1 },
                  },
                },
              ],
            },
          },
        ])
        .exec();

      return {
        resources: resources[0].resources,
        count: resources[0].count[0].count,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getUserFollowers = async (anchorUserId) => {
    try {
      const following = await Following.find({ anchorUserId })
        .select("userId")
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

  const getResourceComments = async (data) => {
    try {
      // Set up pagination
      const pageNo = parseInt(data.pageNo);
      const size = parseInt(data.size);
      let query = {};
      if (pageNo < 0 || pageNo === 0) {
        return {
          error: "Invalid page number",
        };
      }
      query.skip = size * (pageNo - 1);
      query.limit = size;

      const comments = await Comment.aggregate([
        {
          $facet: {
            comments: [
              {
                $match: {
                  resourceId: mongoose.Types.ObjectId(data.resourceId),
                },
              },
              {
                $project: {
                  username: 1,
                  firstName: 1,
                  lastName: 1,
                  content: 1,
                  timestamp: 1,
                  image: 1,
                },
              },
              {
                $skip: query.skip,
              },
              {
                $limit: query.limit,
              },
              {
                $sort: {
                  timestamp: 1,
                },
              },
            ],
            count: [
              {
                $match: {
                  resourceId: mongoose.Types.ObjectId(data.resourceId),
                },
              },
              {
                $group: {
                  _id: 0,
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]).exec();

      let count = 0;
      if (comments[0].count.length > 0) {
        count = comments[0].count[0].count;
      }

      return {
        comments: comments[0].comments,
        count,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getResourceCommentsCount = async (resourceId) => {
    try {
      const commentCount = await Comment.aggregate([
        {
          $match: {
            resourceId: mongoose.Types.ObjectId(resourceId),
          },
        },
        {
          $group: {
            _id: 0,
            count: { $sum: 1 },
          },
        },
      ]);

      if (commentCount[0]) {
        return commentCount[0].count;
      } else {
        return null;
      }
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getUserResources = async (data) => {
    try {
      // Set up pagination
      const pageNo = parseInt(data.pageNo);
      const size = parseInt(data.size);
      let query = {};
      if (pageNo < 0 || pageNo === 0) {
        return {
          error: "Invalid page number",
        };
      }
      query.skip = size * (pageNo - 1);
      query.limit = size;

      const resources = await _Resource
        .aggregate([
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $facet: {
              resources: [
                {
                  $sort: {
                    timestamp: -1,
                  },
                },
                {
                  $match: {
                    userId: ObjectId(data.userId),
                  },
                },
                {
                  $project: {
                    _id: 1,
                    username: "$user.username",
                    userId: 1,
                    url: 1,
                    title: 1,
                    type: 1,
                    tags: 1,
                    description: 1,
                    mdImage: 1,
                    timestamp: 1,
                    recommended_by_count: 1,
                  },
                },
                {
                  $skip: query.skip,
                },
                {
                  $limit: query.limit,
                },
              ],
              count: [
                {
                  $match: {
                    userId: ObjectId(data.userId),
                  },
                },
                {
                  $group: {
                    _id: 0,
                    count: { $sum: 1 },
                  },
                },
              ],
            },
          },
        ])
        .exec();

      return {
        resources: resources[0].resources,
        count: resources[0].count[0].count,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getResource = async (data) => {
    try {
      const resource = await _Resource.aggregate([
        {
          $match: { _id: ObjectId(data) },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $project: {
            _id: 1,
            username: "$user.username",
            userImage: "$user.smImage.link",
            firstName: "$user.firstName",
            lastName: "$user.lastName",
            url: 1,
            title: 1,
            type: 1,
            tags: 1,
            description: 1,
            lgImage: 1,
            smImage: 1,
            mdImage: 1,
            deleteHash: 1,
            timestamp: 1,
            recommended_by_count: 1,
          },
        },
      ]);
      return {
        resource: resource[0],
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getMultipleResources = async (data) => {
    try {
      const resources = await _Resource
        .find({
          _id: { $in: [...getQueries(data)] },
        })
        .sort({ timestamp: -1 })
        .exec();

      let monthsArray = [];
      for (let resource of resources) {
        let timestamp = resource.timestamp.getMonth();
        if (monthsArray.includes(timestamp)) {
          console.log(true);
        }
      }

      return {
        resources,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getMonthName = (month) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return monthNames[month];
  };

  const getCollectionResources = async (data) => {
    try {
      const resources = await _Resource
        .find({
          _id: { $in: [...getQueries(data)] },
        })
        .sort({ timestamp: -1 })
        .exec();
      return {
        resources,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const getQueries = (data) => {
    let mongooseQueryArray = [];
    for (let resource of data) {
      mongooseQueryArray.push(mongoose.Types.ObjectId(resource.resourceId));
    }
    return mongooseQueryArray;
  };

  const getFourImages = async (data) => {
    try {
      let images = [];
      let promises = [];
      for (let item of data) {
        promises.push(getResourceImage(item));
      }
      images = await Promise.all(promises);
      return {
        images,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  function getResourceImage(resourceId) {
    return new Promise((resolve, reject) => {
      const result = _Resource
        .findById(resourceId)
        .select("mdImage smImage lgImage")
        .exec();
      resolve(result);
    });
  }

  const getProfileImageByUsername = async (username) => {
    try {
      const user = await User.findOne({ username }).select("smImage").exec();
      return { image: user.smImage.link };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const searchResources = async (query, options) => {
    try {
      // ! If resource isn't selected
      if (!options.resource) {
        return;
      }

      let recent = false;
      let recommend = false;
      let article = true;

      if (options && options.orderBy === "recent") {
        recent = true;
      }

      if (options && options.orderBy === "recommend") {
        recommend = true;
      }

      if (query.charAt(0) === "#") {
        const sansHash = query.replace("#", "");
        const regex = [new RegExp(sansHash, "i")];

        // * Search for resources with tag
        const resources = await _Resource
          .find({ tags: { $in: regex } }, selectFields)
          .limit(10)
          .sort({
            recommended_by_count: recommend ? -1 : 1,
            timestamp: recent ? -1 : 1,
          })
          .exec();
        return {
          resources,
        };
      }

      const resources = await _Resource
        .find({ title: { $regex: `${query}`, $options: "i" } }, selectFields)
        .limit(10)
        .sort({
          recommended_by_count: recommend ? -1 : 1,
          timestamp: recent ? -1 : 1,
        })
        .exec();
      return {
        resources,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  const searchUserResources = async (data) => {
    try {
      let query = data.query;
      if (query.charAt(0) === "#") {
        const sansHash = query.replace("#", "");
        const regex = [new RegExp(sansHash, "i")];
        // * Search for resources with tag
        const resources = await _Resource
          .find(
            {
              username: data.username,
              tags: { $in: regex },
            },
            selectFields
          )
          .exec();
        return {
          resources,
        };
      }

      const resources = await _Resource
        .find(
          {
            username: data.username,
            title: { $regex: `${query}`, $options: "i" },
          },
          selectFields
        )
        .exec();
      return {
        resources,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  };

  return {
    getAllResources,
    getUserResources,
    getResourceComments,
    getResourceCommentsCount,
    getResource,
    getMultipleResources,
    getResourceImage,
    getFourImages,
    getProfileImageByUsername,
    searchUserResources,
    searchResources,
  };
})();

module.exports = ResourceGet;
