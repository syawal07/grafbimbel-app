// backend/config/db.js (VERSI PERBAIKAN)
const { Pool } = require("pg");

// Kita tidak butuh require('dotenv').config() di dalam Docker,
// karena variabel sudah diberikan oleh docker-compose.

const pool = new Pool({
  // Cukup gunakan satu baris ini.
  // pg akan otomatis mem-parsing semua info dari connection string.
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("Berhasil terhubung ke database PostgreSQL.");
});

pool.on("error", (err) => {
  console.error("Koneksi ke database gagal!", err.stack);
});

module.exports = pool;
