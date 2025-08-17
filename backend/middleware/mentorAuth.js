// backend/middleware/mentorAuth.js

module.exports = function (req, res, next) {
  // Middleware ini berjalan setelah middleware 'auth',
  // jadi kita sudah punya akses ke req.user
  if (req.user.role !== "mentor") {
    return res
      .status(403)
      .json({ message: "Akses ditolak. Rute ini hanya untuk mentor." });
  }
  next();
};
