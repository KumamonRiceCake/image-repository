const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../src/models/user');
const Image = require('../../src/models/image');

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
    _id: userOneId,
    name: 'Jeong Won Kim',
    email: 'lhouette@gmail.com',
    password: 'jwkPass123!',
    tokens: [{
        token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }]
};

const setupDatabase = async () => {
    await User.deleteMany();
    await Image.deleteMany();
    await new User(userOne).save();
};

module.exports = {
    userOne,
    setupDatabase
};