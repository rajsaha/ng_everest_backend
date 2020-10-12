const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const Login = (() => {
    const login = async (username, password) => {
        try {
            const user = await User.findOne({ username: username }).exec();
            const RSA_PRIVATE_KEY = fs.readFileSync(require('path').resolve(__dirname, '../../key/private.pem'));

            // If no username found
            if (!user) {
                return {
                    status: 404,
                    error: "The username does not exist"
                };
            }

            // Compare plaintext password with hash
            const match = user.comparePassword(password, (error, match) => {
                return match;
            });

            if (match) {
                const jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
                    algorithm: 'RS256',
                    expiresIn: "2d",
                    subject: user._id.toString()
                });
                return {
                    message: "Logged in",
                    token: jwtBearerToken,
                    username: user.username,
                    userId: user._id,
                    image: user.smImage.link,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    expiresIn: 172800000
                }
            } else {
                return {
                    status: 400,
                    error: 'Username/password invalid'
                }
            }
        } catch (err) {
            return {
                error: err.message
            };
        }
    }

    return {
        login
    }
})();

module.exports = Login;