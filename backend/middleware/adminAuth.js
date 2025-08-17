// backend/middleware/adminAuth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Middleware ini harus dijalankan SETELAH middleware auth standar
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Akses ditolak. Hanya untuk Admin." });
  }
  next();
};
