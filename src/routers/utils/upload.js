const multer = require('multer');

const upload = multer({
    limits: {
        fileSize: 4000000  //4mb
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'));
        }

        cb(undefined, true);
    }
});

module.exports = upload;