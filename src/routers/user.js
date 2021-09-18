const express = require('express');
const path = require('path');
const { emptyDirectory } = require('./utils/s3');
const User = require('../models/user');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/users', async (req, res) => {
    const user = new User(req.body);
    
    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.cookie('auth_token', token);
        res.status(201).redirect('/dashboard');
        //res.status(201).sendFile(path.resolve(__dirname, '..', 'views', 'dashboard.html'));
        //res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.cookie('auth_token', token);
        res.status(200).redirect('/dashboard');
        //res.status(200).sendFile(path.resolve(__dirname, '..', 'views', 'dashboard.html'));
        //res.send({ user, token });
    } catch (e) {
        res.status(400).send(e.message);
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        })
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);

    if (updates.length === 0) {
        return res.status(400).send({ error: 'Please provide at least one field!' });
    }

    const allowedUpdates = ['name', 'email', 'password'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();

        // Empty user directory
        await emptyDirectory(req.user._id + '/');

        res.send(req.user);
    } catch (e) {
        res.status(500).send();
    }
});

module.exports = router;