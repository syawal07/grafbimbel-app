const pool = require("../config/db");

const contentController = {
  // --- Fungsi untuk Keunggulan ---
  async getAdvantages(req, res) {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM advantages ORDER BY id ASC"
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  },
  async createAdvantage(req, res) {
    try {
      const { title, description, icon_svg } = req.body;
      const query =
        "INSERT INTO advantages (title, description, icon_svg) VALUES ($1, $2, $3) RETURNING *";
      const { rows } = await pool.query(query, [title, description, icon_svg]);
      res.status(201).json(rows[0]);
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  },
  async updateAdvantage(req, res) {
    try {
      const { id } = req.params;
      const { title, description, icon_svg } = req.body;
      const query =
        "UPDATE advantages SET title = $1, description = $2, icon_svg = $3 WHERE id = $4 RETURNING *";
      const { rows } = await pool.query(query, [
        title,
        description,
        icon_svg,
        id,
      ]);
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  },
  async deleteAdvantage(req, res) {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM advantages WHERE id = $1", [id]);
      res.json({ message: "Keunggulan berhasil dihapus." });
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  },

  // --- Fungsi untuk FAQ ---
  async getFaqs(req, res) {
    try {
      const { rows } = await pool.query("SELECT * FROM faqs ORDER BY id ASC");
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  },
  async createFaq(req, res) {
    try {
      const { question, answer } = req.body;
      const query =
        "INSERT INTO faqs (question, answer) VALUES ($1, $2) RETURNING *";
      const { rows } = await pool.query(query, [question, answer]);
      res.status(201).json(rows[0]);
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  },
  async updateFaq(req, res) {
    try {
      const { id } = req.params;
      const { question, answer } = req.body;
      const query =
        "UPDATE faqs SET question = $1, answer = $2 WHERE id = $3 RETURNING *";
      const { rows } = await pool.query(query, [question, answer, id]);
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  },
  async deleteFaq(req, res) {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM faqs WHERE id = $1", [id]);
      res.json({ message: "FAQ berhasil dihapus." });
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  },
};

module.exports = contentController;
