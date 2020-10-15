var mongoose = require("mongoose");
var CommentSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resource",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

var Comment = mongoose.model("Comment", CommentSchema);
module.exports = Comment;
