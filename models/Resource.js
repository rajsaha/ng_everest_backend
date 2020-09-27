var mongoose = require("mongoose");
var ResourceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User",
    trim: true
  },
  url: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true
  },
  tags: [
    {
      type: [String],
      trim: true
    }
  ],
  description: {
    type: String,
    required: true,
    trim: true
  },
  lgImage: {
    link: {
      type: String
    },
    id: {
      type: String
    },
    deleteHash: {
      type: String
    }
  },
  mdImage: {
    link: {
      type: String
    },
    id: {
      type: String
    },
    deleteHash: {
      type: String
    }
  },
  smImage: {
    link: {
      type: String
    },
    id: {
      type: String
    },
    deleteHash: {
      type: String
    }
  },
  noImage: {
    type: Boolean,
    default: false
  },
  backgroundColor: {
    type: String,
    default: "#000"
  },
  textColor: {
    type: String,
    default: "#fff"
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  recommended_by_count: {
    type: Number,
    default: 0
  }
});

var Resource = mongoose.model("Resource", ResourceSchema);
module.exports = Resource;
