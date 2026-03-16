const multer = require('multer');
const path = require('path');
// const AWS = require('aws-sdk'); // Uncomment for S3
// const multerS3 = require('multer-s3'); // Uncomment for S3

// --- LOCAL STORAGE (Current) ---
const localStorage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

/*
// --- S3 STORAGE (Ready for Cloud) ---
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});

const s3Storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        cb(null, `uploads/${Date.now()}_${file.originalname}`);
    }
});
*/

const upload = multer({
    storage: localStorage, // Switch to s3Storage when ready
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetypes = /image\/jpeg|image\/jpg|image\/png|application\/pdf/;

        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = mimetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and PDFs are allowed!'));
        }
    },
    limits: { fileSize: 5000000 }, // 5MB limit
});

module.exports = upload;
