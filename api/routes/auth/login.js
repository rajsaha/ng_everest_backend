const express = require('express');
const router = express.Router();
const Login = require('../../../services/auth/login');

router.post('/', async (req, res, next) => {
    try {
        const response = await Login.login(req.body.username, req.body.password);
        res.json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

module.exports = router;