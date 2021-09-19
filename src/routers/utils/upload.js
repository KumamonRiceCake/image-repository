const multer = require('multer');

/*  multer middleware for handling uploaded image files.
    This program handles only jpg, jpeg, png, bmp, and gif image formats.
*/
const upload = multer({
    limits: {
        fileSize: 4000000  // 4mb maximum
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|bmp|gif)$/)) {
            return cb(new Error('Please upload an image'));
        }

        cb(undefined, true);
    }
});

module.exports = upload;