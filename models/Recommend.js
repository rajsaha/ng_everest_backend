var mongoose = require("mongoose");
var RecommendSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resource",
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

var Recommend = mongoose.model("Recommend", RecommendSchema);
module.exports = Recommend;
