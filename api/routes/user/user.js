const express = require('express');
const router = express.Router();
const User = require('../../../services/user/user');
const checkIfAuthenticated = require('../../../services/auth/checkIfAuthorized');

router.get('/get-user-data/:username', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await User.getProfileData(req.params.username);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/update-user-data', async (req, res, next) => {
    try {
        const response = await User.updateProfileData(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/remove-user-interest', async (req, res, next) => {
    try {
        const response = await User.removeInterest(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/save-profile-photo', async (req, res, next) => {
    try {
        const response = await User.saveProfilePhoto(req.body.id, req.body.image, req.body.username);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

router.delete('/delete-profile-photo/:id/:deleteHash', async (req, res, next) => {
    try {
        const response = await User.deleteProfilePhoto(req.params.id, req.params.deleteHash);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

router.get('/get-profile-photo/:username', async (req, res, next) => {
    try {
        const response = await User.getProfilePhoto(req.params.username);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

router.post('/update-password', async (req, res, next) => {
    try {
        const response = await User.changePassword(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

// * Like / Unlike routes
router.post('/like', async (req, res, next) => {
    try {
        const response = await User.likePost(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

router.post('/unlike', async (req, res, next) => {
    try {
        const response = await User.unlikePost(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

router.post('/check-if-post-liked', async (req, res, next) => {
    try {
        const response = await User.checkIfPostIsLiked(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

module.exports = router;