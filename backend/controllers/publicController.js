// backend/controllers/publicController.js
const pool = require("../config/db");

const publicController = {
  // Fungsi untuk mengambil semua paket yang akan ditampilkan ke publik
  async getPublicPackages(req, res) {
    try {
      // Kita bisa filter paket tertentu jika mau, atau tampilkan semua
      const { rows } = await pool.query(
        "SELECT * FROM packages ORDER BY price ASC"
      );
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil paket publik:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },
  async getPackageById(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await pool.query(
        "SELECT * FROM packages WHERE package_id = $1",
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Paket tidak ditemukan." });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error("Error mengambil data paket by id (public):", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },
};

module.exports = publicController;
