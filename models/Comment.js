var mongoose = require("mongoose");
var CommentSchema = new mongoose.Schema({
  resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true
  },   
  username: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String,
    trim: true
  }
});

var Comment = mongoose.model("Comment", CommentSchema);
module.exports = Comment;
