var mongoose = require("mongoose");
var CollectionCommentSchema = new mongoose.Schema({
  anchorCollectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection",
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resource",
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

var CollectionComment = mongoose.model(
  "CollectionComment",
  CollectionCommentSchema
);
module.exports = CollectionComment;
