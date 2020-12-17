const express = require('express');
const router = express.Router();
const ForgotPassword = require('../../../services/forgot-password/forgot-password')

router.post('/forgot-password-step-1', async (req, res, next) => {
    try {
        const response = await ForgotPassword.forgotPasswordStep1(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/forgot-password-step-2', async (req, res, next) => {
    try {
        const response = await ForgotPassword.forgotPasswordStep2(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/forgot-password-step-3', async (req, res, next) => {
    try {
        const response = await ForgotPassword.forgotPasswordStep3(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

module.exports = router;