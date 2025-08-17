// backend/controllers/studentController.js
const pool = require("../config/db");

const studentController = {
  // =======================================================
  // == FUNGSI BARU UNTUK HALAMAN JADWAL SISWA ==
  // =======================================================

  /**
   * Mengambil semua jadwal mendatang untuk siswa yang sedang login.
   * Ini akan digunakan di halaman "Jadwal Saya" milik siswa.
   */
  async getMySchedules(req, res) {
    try {
      const studentId = req.user.id;
      const query = `
      SELECT 
        s.schedule_id, 
        s.session_datetime, 
        s.zoom_link,
        u.full_name as mentor_name
      FROM schedules s
      LEFT JOIN users u ON s.mentor_id = u.user_id -- <-- PERUBAHAN DI SINI
      WHERE s.student_id = $1 
        AND s.status = 'scheduled' 
        AND s.session_datetime >= NOW()
      ORDER BY s.session_datetime ASC;
    `;
      const { rows } = await pool.query(query, [studentId]);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil jadwal siswa:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  // =======================================================
  // == FUNGSI LAIN YANG MASIH RELEVAN ==
  // =======================================================

  /**
   * Mengambil semua paket yang pernah atau sedang dimiliki siswa.
   */
  async getMyPackages(req, res) {
    try {
      const studentId = req.user.id;
      const query = `
        SELECT 
          up.user_package_id, up.purchase_date, up.activation_date, up.expiry_date,
          up.remaining_sessions, up.status,
          p.package_name, p.total_sessions
        FROM user_packages up
        JOIN packages p ON up.package_id = p.package_id
        WHERE up.student_id = $1
        ORDER BY up.purchase_date DESC;
      `;
      const { rows } = await pool.query(query, [studentId]);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil riwayat paket siswa:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  /**
   * Mengambil semua laporan sesi yang sudah diverifikasi admin.
   */
  async getMyReports(req, res) {
    try {
      const studentId = req.user.id;
      const query = `
        SELECT 
          sr.report_id, sr.summary, sr.student_development_journal,
          s.session_datetime,
          u.full_name as mentor_name
        FROM session_reports sr
        JOIN schedules s ON sr.schedule_id = s.schedule_id
        JOIN users u ON sr.mentor_id = u.user_id
        WHERE sr.student_id = $1 AND sr.verified_by_admin = true
        ORDER BY s.session_datetime DESC;
      `;
      const { rows } = await pool.query(query, [studentId]);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil riwayat laporan siswa:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  /**
   * Proses siswa membeli paket baru dan mengunggah bukti bayar.
   */
  async createPurchaseRequest(req, res) {
    const { package_id } = req.body;
    const studentId = req.user.id;

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Bukti pembayaran wajib diunggah." });
    }
    const payment_proof_url = req.file.path.replace(/\\/g, "/");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existingPackageQuery = await client.query(
        "SELECT * FROM user_packages WHERE student_id = $1 AND package_id = $2 AND status IN ('active', 'pending')",
        [studentId, package_id]
      );
      if (existingPackageQuery.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          message: "Anda sudah memiliki permintaan aktif atau paket ini.",
        });
      }

      const packagePriceResult = await client.query(
        "SELECT price, total_sessions FROM packages WHERE package_id = $1",
        [package_id]
      );
      if (packagePriceResult.rows.length === 0) {
        throw new Error("Paket tidak valid atau tidak ditemukan.");
      }
      const { price, total_sessions } = packagePriceResult.rows[0];

      const packageQuery = `
        INSERT INTO user_packages (student_id, package_id, remaining_sessions, status)
        VALUES ($1, $2, $3, 'pending')
        RETURNING user_package_id;
      `;
      const packageResult = await client.query(packageQuery, [
        studentId,
        package_id,
        total_sessions,
      ]);

      const { user_package_id } = packageResult.rows[0];
      const paymentQuery = `
        INSERT INTO payments (user_package_id, student_id, amount, payment_date, status, payment_proof_url)
        VALUES ($1, $2, $3, NOW(), 'pending', $4);
      `;
      await client.query(paymentQuery, [
        user_package_id,
        studentId,
        price,
        payment_proof_url,
      ]);

      await client.query("COMMIT");
      res.status(201).json({
        message:
          "Konfirmasi pembayaran berhasil dikirim dan sedang menunggu verifikasi.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error membuat permintaan pembelian:", error);
      res
        .status(500)
        .json({ message: error.message || "Terjadi kesalahan pada server" });
    } finally {
      client.release();
    }
  },
};

module.exports = studentController;
