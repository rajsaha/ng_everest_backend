var mongoose = require('mongoose');
var CollectionSchema = new mongoose.Schema({
    anchorUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
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
    xsImage: {
        type: String,
        required: false,
        trim: true
    },
    smImage: {
        type: String,
        required: false,
        trim: true
    },
    mdImage: {
        type: String,
        required: false,
        trim: true
    },
    lgImage: {
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
