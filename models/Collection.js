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
    timestamp: {
        type: Date,
        default: Date.now
    }
});


var Collection = mongoose.model('Collection', CollectionSchema);
module.exports = Collection;
