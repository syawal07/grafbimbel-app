// backend/middleware/upload.js
const multer = require("multer");
const path = require("path");

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Folder penyimpanan
  },
  filename: function (req, file, cb) {
    // Membuat nama file unik: fieldname-timestamp.extension
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Middleware upload
const upload = multer({ storage: storage });
module.exports = upload;
