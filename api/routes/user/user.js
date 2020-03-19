const express = require('express');
const router = express.Router();
const User = require('../../../services/user/user');
const checkIfAuthenticated = require('../../../services/auth/checkIfAuthorized');

router.post('/get-user-data', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await User.getProfileData(req.body.userId);
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

router.delete('/delete-profile-photo/:id', async (req, res, next) => {
    try {
        const response = await User.deleteProfilePhoto(req.params.id);
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

// * Get public profile of other users
router.post('/get-public-profile', async (req, res, next) => {
    try {
        const response = await User.getPublicProfile(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

// * Follow / unfollow user
router.post('/follow', async (req, res, next) => {
    try {
        const response = await User.followUser(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

router.post('/unfollow', async (req, res, next) => {
    try {
        const response = await User.unfollowUser(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

router.post('/check-if-user-followed', async (req, res, next) => {
    try {
        const response = await User.checkIfUserIsFollowed(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

router.post('/global-search/:query', async (req, res, next) => {
    try {
        const response = await User.globalSearch(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

router.get('/get-followers-following/:username', async (req, res, next) => {
    try {
        const response = await User.getFollowersFollowing(req.params.username);
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
});

module.exports = router;