/**
 * This file includes router about user dashboard
 */

const express = require('express');
const path = require('path');
const auth = require('../middleware/auth');

const router = new express.Router();

// User dashboard
router.get('/dashboard', auth, (req, res) => {
    res.status(200).sendFile(path.resolve(__dirname, '..', 'views', 'dashboard.html'));
});

// User dashboard with result of tag search
router.get('/dashboard/search', auth, (req, res) => {
    res.status(200).sendFile(path.resolve(__dirname, '..', 'views', 'search.html'));
});

module.exports = router;