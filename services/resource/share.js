const ogs = require('open-graph-scraper');
const mongoose = require('mongoose');
const Resource = require('../../models/Resource');
const CollectionService = require('../collection/collection');
const Imgur = require('../imgur/imgur');

const ResourceShare = (() => {
    const getOpenGraphData = async (url) => {
        const response = await ogs({
            'url': url
        });

        if (!response) {
            return {
                message: response
            }
        } else {
            return {
                message: {
                    error: false,
                    status: 200,
                    data: response
                }
            }
        }
    }

    const shareResource = async (data) => {
        try {
            let saveCustomImageForResourceResponse = null;
            let image = null;
            let deleteHash = null;

            // * Handle user uploading custom image
            if (data.customImage) {
                // * Get image link and delete hash from imgur
                saveCustomImageForResourceResponse = await Imgur.saveImage(data.customImage);
                image = saveCustomImageForResourceResponse.data.data.link;
                deleteHash = saveCustomImageForResourceResponse.data.data.deletehash;
            } else {
                image = data.formData.image;
            }

            const resource = new Resource({
                _id: new mongoose.Types.ObjectId(),
                username: data.formData.username,
                url: data.formData.url,
                title: data.formData.title,
                type: data.formData.type,
                description: data.formData.description,
                image: image,
                deleteHash: deleteHash,
                tags: data.tags
            });

            await resource.save();

            if (data.formData.collectionName) {
                const collection = await CollectionService.getCollectionByTitle(data.formData.collectionName);
                if (collection.collection) {
                    // * Push into existing collection
                    await CollectionService.pushIntoCollection({
                        title: data.formData.collectionName,
                        resourceId: resource.id
                    });
                } else {
                    // * Create new collection and push resource into it
                    await CollectionService.createCollectionAndPushResource({
                        username: data.formData.username,
                        title: data.formData.collectionName,
                        resourceId: resource.id
                    });
                }
            }

            return {
                message: {
                    error: false,
                    status: 200,
                    data: {
                        message: 'Resource saved!'
                    }
                }
            };
        } catch (error) {
            return {
                status: 500,
                error: error.message
            };
        }
    }

    return {
        getOpenGraphData,
        shareResource
    }
})()

module.exports = ResourceShare;