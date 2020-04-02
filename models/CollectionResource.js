var mongoose = require("mongoose");
var CollectionResourceSchema = new mongoose.Schema({
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

var CollectionResource = mongoose.model(
  "CollectionResource",
  CollectionResourceSchema
);
module.exports = CollectionResource;
