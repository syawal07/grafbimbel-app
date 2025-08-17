// backend/controllers/packageController.js
const db = require("../config/db");

const packageController = {
  // Fungsi untuk mengambil semua paket
  async getAll(req, res) {
    try {
      const { rows } = await db.query(
        "SELECT * FROM packages ORDER BY price ASC"
      );
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil semua paket:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  // --- FUNGSI BARU DITAMBAHKAN DI SINI ---
  async getById(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await db.query(
        "SELECT * FROM packages WHERE package_id = $1",
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Paket tidak ditemukan." });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error("Error mengambil paket by id:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },
};

module.exports = packageController;
