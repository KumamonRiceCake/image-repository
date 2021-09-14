const express = require('express');
const { listFolders, createFolder, listFiles, uploadFile, deleteFile, emptyDirectory } = require('./utils/s3');
const upload = require('./utils/upload');
const auth = require('../middleware/auth');
const Image = require('../models/image');

const router = new express.Router();

// Upload image
router.post('/image', auth, upload.single('image'), async (req, res) => {
    if (!req.file || req.body.directory === undefined) {
        return res.status(400).send();
    }

    const directory = req.user._id + '/' + req.body.directory.trim();
    const file = req.file.buffer;
    file.name = req.file.originalname;
    
    try {
        const fileUpload = await uploadFile(directory, file);
        if (fileUpload.error) {
            return res.status(400).send(fileUpload);
        }

        const fileData = new Image({
            directory: req.body.directory.trim(),
            filename: file.name,
            url: fileUpload,
            owner: req.user._id,
            tag: req.body.tag.trim()
        });
        await fileData.save();

        res.send(fileData);
    } catch (e) {
        res.status(500).send(e.message);
    }
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

// List files and folders in folder
router.get('/image/directory', auth, async (req, res) => {
    // directory field not provided
    if (req.body.directory === undefined) {
        return res.status(400).send();
    }

    try {
        const fileList = await listFiles(req.user._id + '/' + req.body.directory.trim());

        if (fileList.length === 0) {
            return res.status(404).send({ error: 'Directory not exist' });
        }

        res.send(fileList);
    } catch (e) {
        res.status(500).send();
    }
});

// Get file link
router.get('/image', auth, async (req, res) => {
    // filepath not provided
    if (req.body.directory === undefined || req.body.filename === undefined) {
        return res.status(400).send();
    }
    
    try {
        const image = await Image.findOne({ directory: req.body.directory.trim(), filename: req.body.filename, owner: req.user._id });
        if (!image) {
            return res.status(404).send();
        }

        res.send([ image.url ]);
    } catch (e) {
        res.status(500).send();
    }
});

// List folders
router.get('/image/folders', auth, async (req, res) => {
    if (req.body.directory === undefined) {
        return res.status(400).send();
    }

    try {
        const folders = await listFolders(req.user._id + '/' + req.body.directory.trim());
        if (folders.error) {
            return res.status(404).send(folders.error);
        }
        res.send(folders);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Create folder
router.post('/image/folders', auth, async (req, res) => {
    // directory or folderName not provided
    if (req.body.directory === undefined || req.body.folderName === undefined) {
        return res.status(400).send();
    }

    try {
        createFolder(req.user._id + '/' + req.body.directory.trim(), req.body.folderName, (err) => {
            if (err) {
                return res.status(400).send(err);
            }
            res.status(201).send();
        });
    } catch (e) {
        res.status(500).send(e);
    }
});

// Delete file or folder
router.delete('/image', auth, async (req, res) => {
    // directory or folderName not provided
    if (req.body.directory === undefined || req.body.filename === undefined) {
        return res.status(400).send();
    }

    const filepath = req.user._id + '/' + req.body.directory.trim() + req.body.filename;

    try {
        const deletionError = await deleteFile(filepath);
        // Invalid filepath (not exist or non-empty folder)
        if (deletionError) {
            return res.status(400).send(deletionError);
        }

        // If it is a file, delete data from database
        if (!req.body.filename.endsWith('/')) {
            const deletedImage = await Image.findOneAndDelete({ directory: req.body.directory.trim(), filename: req.body.filename, owner: req.user._id });
            if (!deletedImage) {
                return res.status(404).send();
            }
            return res.send(deletedImage);
        }

        res.send();
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Empty directory
router.delete('/image/directory', auth, async (req, res) => {
    // directory field not provided
    if (req.body.directory === undefined) {
        return res.status(400).send();
    }

    try {
        const filelist = await emptyDirectory(req.user._id + '/' + req.body.directory.trim());
        // directory not exist
        if (filelist.error) {
            return res.status(404).send(filelist);
        }
        
        // If it is a file, delete data from database
        filelist.forEach(async (key) => {
            key = key.replace(req.user._id + '/', '');
            const divisionIndex = key.lastIndexOf('/');
            const directory = key.substring(0, divisionIndex+1);
            const filename = key.substring(divisionIndex+1, key.length+1);
            const image = await Image.findOneAndDelete({ directory, filename, owner: req.user._id });

            if (!image) {
                return res.status(404).send();
            }
        })
        
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
});

// List all files of user
// GET /image/me?limit=10&skip=10
// GET /image/me?sortBy=createdAt:desc
// GET /image/me?tag=dogs
router.get('/image/me', auth, async (req, res) => {
    const sort = {};
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    try {
        await req.user.populate({
            path: 'images',
            match: { tag: req.query.tag },
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();

        if (!req.user.images) {
            return res.status(404).send();
        }

        res.send(req.user.images);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

module.exports = router;