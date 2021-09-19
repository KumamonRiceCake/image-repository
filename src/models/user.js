/**
 * This file includes User schema of MongoDB and relative functions
 */

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Image = require('./image');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password must not contain "password"')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
});

// Create a virtual property 'images' that's computed from 'Image'
userSchema.virtual('images', {
    ref: 'Image',
    localField: '_id',
    foreignField: 'owner'
});

// Delete password and token before returning user object
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
};

// Generate authentication token for logging-in user
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
    
    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;
};

// Verify user with email and password
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error('The user account does not exist. Please check your email address.');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Unable to login. Please check your password and try again.');
    }

    return user;
};

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

//Delete user images from DB when user is removed
userSchema.pre('remove', async function (next) {
    const user = this;
    await Image.deleteMany({ owner: user._id });
    next();
});

const User = mongoose.model('User', userSchema);

User.createIndexes();

module.exports = User;