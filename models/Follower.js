var mongoose = require("mongoose");
var FollowerSchema = new mongoose.Schema({
  anchorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

var Follower = mongoose.model("Follower", FollowerSchema);
module.exports = Follower;
