const express = require('express');
const path = require('path');
const auth = require('../middleware/auth');

const router = new express.Router();

router.get('/dashboard', auth, (req, res) => {
    res.status(200).sendFile(path.resolve(__dirname, '..', 'views', 'dashboard.html'));
});

router.get('/dashboard/search', auth, (req, res) => {
    res.status(200).sendFile(path.resolve(__dirname, '..', 'views', 'search.html'));
});

module.exports = router;