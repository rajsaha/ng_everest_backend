var mongoose = require("mongoose");
var ForgotPasswordSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    valid: {
        type: Boolean,
        required: true,
        default: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

var ForgotPassword = mongoose.model("ForgotPassword", ForgotPasswordSchema);
module.exports = ForgotPassword;