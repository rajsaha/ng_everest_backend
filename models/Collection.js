var mongoose = require('mongoose');
var CollectionSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    resources: [{
        resourceId: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    timestamp: {
        type: Date,
        default: Date.now
    },
    comments: [{
        username: String,
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    recommended_by: [String],
    recommended_by_count: {
        type: Number,
        default: 0
    }
});


var Collection = mongoose.model('Collection', CollectionSchema);
module.exports = Collection;
