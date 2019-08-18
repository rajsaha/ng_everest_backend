const express = require('express');
const router = express.Router();
const Signup = require('../../../services/signup/signup');

router.post('/', async (req, res, next) => {
    try {
        const response = await Signup.signup(req.body);
        res.json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

module.exports = router;