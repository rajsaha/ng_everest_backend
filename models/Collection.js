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
    resources: [{
        type: [String],
        trim: true,
        unique: true
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
