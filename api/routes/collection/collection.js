const express = require('express');
const router = express.Router();
const Collection = require('../../../services/collection/collection');
const checkIfAuthenticated = require('../../../services/auth/checkIfAuthorized');

router.post('/get-collections', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await Collection.getCollections(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/get-collection-by-id', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await Collection.getCollectionById(req.body.id);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/get-collection-names', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await Collection.getCollectionNames(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/get-collection-title-by-resource-id', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await Collection.getCollectionNameByResourceId(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/check-for-resource-in-collection', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await Collection.checkForResourceInAnyCollection(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/delete-resource-from-collection', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await Collection.deleteResourceFromCollection(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.get('/delete-collection/:id', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await Collection.deleteCollection(req.params.id);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/change-collection-title', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await Collection.changeCollectionTitle(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/change-collection-description', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await Collection.changeCollectionDescription(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

router.post('/create-collection-and-push-resource', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await Collection.createCollectionAndPushResource(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

// Search
router.post('/search-user-collections', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await Collection.searchUserCollections(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

// Check if collection belongs to logged in user
router.post('/check-if-mine', checkIfAuthenticated, async (req, res, next) => {
    try {
        const response = await Collection.checkIfCollectionBelongsToUserLoggedIn(req.body);
        res.status(200).json(response);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
});

module.exports = router;