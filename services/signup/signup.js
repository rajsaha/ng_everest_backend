const User = require('../../models/User');
const mongoose = require('mongoose');
const Validation = require('../validation/validation');
const UserService = require('../user/user');

const Signup = (() => {
    const signup = async (data) => {
        return await Validation.SignUpDataValidation(data).then(async (res) => {
            if (res.status) {
                const user = new User({
                    _id: new mongoose.Types.ObjectId(),
                    email: data.email,
                    username: data.username,
                    password: data.password,
                    firstName: data.firstName,
                    lastName: data.lastName
                });

                try {
                    // Save user
                    await user.save();

                    // Add self to follow list
                    await UserService.followUser({
                        anchorUserId: user.id,
                        userId: user.id
                    });

                    // Add everest user to follow list
                    await UserService.followUser({
                        anchorUserId: user.id,
                        userId: "5e54d695de6b3f0c58da7de1"
                    });
                    return {
                        status: 200,
                        message: "Signup successful",
                        username: data.username
                    };
                } catch (error) {
                    return {
                        status: 500,
                        error: error.message
                    };
                }
            } else {
                return {
                    status: 500,
                    error: res.messages,
                    message: 'Validation failed'
                };
            }
        });
    }

    return {
        signup
    }
})();

module.exports = Signup;