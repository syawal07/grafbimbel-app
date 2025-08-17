// backend/controllers/dashboardController.js
const db = require("../config/db");

const dashboardController = {
  async getSiswaDashboard(req, res) {
    try {
      const studentId = req.user.id; // Diambil dari token setelah verifikasi middleware
      const query = `
        SELECT 
          up.remaining_sessions, up.expiry_date,
          p.package_name, p.total_sessions
        FROM user_packages up
        JOIN packages p ON up.package_id = p.package_id
        WHERE up.student_id = $1 AND up.status = 'active'
        LIMIT 1;
      `;

      const { rows } = await db.query(query, [studentId]);

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Tidak ada paket aktif ditemukan." });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error("Error mengambil data dashboard siswa:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },
};
module.exports = dashboardController;
