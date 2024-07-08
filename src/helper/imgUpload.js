const multer = require('multer');
const fs = require('fs');
// Configure Multer for file uploads
 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create uploads directory if it does not exist
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});


const uploadSingleFile = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, 
 });

 
module.exports =  {uploadSingleFile}