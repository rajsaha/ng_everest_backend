var mongoose = require("mongoose");
var CommentSchema = new mongoose.Schema({
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
var ResourceSchema = new mongoose.Schema({
  username: {
    type: String,
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
  timestamp: {
    type: Date,
    default: Date.now
  },
  comments: [CommentSchema],
  recommended_by_count: {
    type: Number,
    default: 0
  }
});

var Resource = mongoose.model("Resource", ResourceSchema);
module.exports = Resource;
