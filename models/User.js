var mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

var UserSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
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
    xsImage: {
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
    bio: String,
    website: String,
    interests: [{
        type: [String],
        trim: true
    }],
    collections: [{
        title: String,
        resources: [String]
    }],
    followers: {
        type: [String],
        default: 'everest'
    },
    following: {
        type: [String],
        default: 'everest'
    },
    recommends: [String],
    score: {
        type: Number,
        default: 0
    }
});

UserSchema.pre('save', function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = bcryptjs.hashSync(this.password, 10);
    next();
});

UserSchema.methods.comparePassword = function (password, callback) {
    return callback(null, bcryptjs.compareSync(password, this.password));
};

var User = mongoose.model('User', UserSchema);
module.exports = User;