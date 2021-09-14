const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    directory: {
        type: String,
        required: false,
        trim: true
    },
    filename: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    tag: {
        type: String,
        required: false,
        trim: true
    }
}, {
    timestamps: true
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;