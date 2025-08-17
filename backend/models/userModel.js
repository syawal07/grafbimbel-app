// backend/models/userModel.js

const db = require("../config/db");

const User = {
  // Cari user berdasarkan email
  async findByEmail(email) {
    const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return rows[0];
  },

  // Fungsi umum untuk menyimpan user (digunakan dalam createAdmin, etc.)
  async createUserData({
    full_name,
    email,
    password_hash,
    phone_number,
    role,
  }) {
    const query = `
      INSERT INTO users (full_name, email, password_hash, phone_number, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, full_name, email, role
    `;
    const { rows } = await db.query(query, [
      full_name,
      email,
      password_hash,
      phone_number,
      role,
    ]);
    return rows[0];
  },

  // Buat user siswa
  async createUser(data) {
    return this.createUserData({ ...data, role: "siswa" });
  },

  // Buat user mentor
  async createMentor(data) {
    return this.createUserData({ ...data, role: "mentor" });
  },

  // Buat user admin
  async createAdmin(data) {
    return this.createUserData({ ...data, role: "admin" });
  },
};

module.exports = User;
