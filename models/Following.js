var mongoose = require("mongoose");
var FollowingSchema = new mongoose.Schema({
  anchorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
  },   
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

var Following = mongoose.model("Following", FollowingSchema);
module.exports = Following;
