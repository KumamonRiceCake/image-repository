/**
 * This file includes router about users
 */

const express = require('express');
const path = require('path');
const { emptyDirectory } = require('./utils/s3');
const User = require('../models/user');
const auth = require('../middleware/auth');
const router = new express.Router();

/**
 * Sign up new user.
 * Requirement: user name, email, password
 */
router.post('/users', async (req, res) => {
    // Check exisiting user email
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) { return res.status(400).send({ error: 'User with this email address already exists.' }); }

    const user = new User(req.body);
    
    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.cookie('auth_token', token);
        res.status(201).redirect('/dashboard'); // Successful signup redirect page to dashboard
    } catch (e) {
        // Client checks user name and password length, so it sends alert message about invalid email and redirects to the register page
        res.status(400).send('<script>alert("Please enter a valid email address!");location.href="/register.html";</script>');
    }
});

/**
 * Login user.
 * Requirement: email, password
 */
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.cookie('auth_token', token);
        res.status(200).redirect('/dashboard'); // Successful signup redirect page to dashboard
    } catch (e) {
        // When login fails, sends alert message and redirects to the login page
        res.status(400).send(`<script>alert("${e.message}");location.href="/";</script>`);
    }
});

/**
 * Logout user.
 */
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

/**
 * Logout all user tokens.
 */
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

/**
 * Get user profile.
 */
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

/**
 * Update user profile.
 * Allowed update fields: name, email, password
 */
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

/**
 * Delete user.
 */
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