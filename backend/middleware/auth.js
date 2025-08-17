// backend/middleware/auth.js (Versi Final yang Benar)
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // 1. Ambil header 'Authorization'
  const authHeader = req.header("Authorization");

  // 2. Cek apakah header ada dan menggunakan format 'Bearer'
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Akses ditolak, format token salah atau tidak ada." });
  }

  try {
    // 3. Ambil tokennya saja (hilangkan kata 'Bearer ')
    const token = authHeader.split(" ")[1];

    // 4. Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token tidak valid." });
  }
};
