// backend/controllers/mentorController.js (Versi Sesuai Revisi)
const pool = require("../config/db"); // Pastikan path ini benar

const mentorController = {
  // =================================================================
  // == FUNGSI UNTUK ALUR PENJADWALAN BARU (SESUAI REVISI) ==
  // =================================================================

  /**
   * Mengambil daftar paket siswa yang ditugaskan ke mentor,
   * lengkap dengan rekomendasi jadwal dari Admin.
   * Ini adalah langkah pertama untuk Mentor sebelum membuat jadwal.
   */
  async getAssignedPackages(req, res) {
    try {
      const mentorId = req.user.id;
      const query = `
      SELECT 
        up.user_package_id,
        up.schedule_recommendation,
        u.user_id AS student_id,
        u.full_name AS student_name,
        p.package_name AS package_name  -- <-- PERBAIKAN DI SINI
      FROM 
        user_packages up
      JOIN 
        users u ON up.student_id = u.user_id
      JOIN
        packages p ON up.package_id = p.package_id
      WHERE 
        up.mentor_id = $1 AND up.status = 'active';
    `;
      const { rows } = await pool.query(query, [mentorId]);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil paket yang ditugaskan:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  /**
   * Membuat jadwal sesi baru untuk seorang siswa.
   * Dipakai oleh Mentor setelah melihat rekomendasi dari Admin.
   */
  async createSchedule(req, res) {
    try {
      const mentorId = req.user.id;
      // Ambil zoom_link dari body
      const { student_id, user_package_id, session_datetime, zoom_link } =
        req.body;

      if (!student_id || !user_package_id || !session_datetime) {
        return res
          .status(400)
          .json({ message: "Siswa, paket, dan waktu sesi wajib diisi." });
      }

      // Modifikasi query untuk menyertakan zoom_link
      const query = `
      INSERT INTO schedules (student_id, mentor_id, user_package_id, session_datetime, zoom_link, status)
      VALUES ($1, $2, $3, $4, $5, 'scheduled')
      RETURNING *;
    `;
      const { rows } = await pool.query(query, [
        student_id,
        mentorId,
        user_package_id,
        session_datetime,
        zoom_link, // <-- Kirim ke database
      ]);

      res
        .status(201)
        .json({ message: "Jadwal berhasil dibuat.", schedule: rows[0] });
    } catch (error) {
      console.error("Error saat mentor membuat jadwal:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  // =================================================================
  // == FUNGSI PENDUKUNG UNTUK MANAJEMEN JADWAL & SESI ==
  // =================================================================

  /**
   * Mengambil semua jadwal (mendatang dan lampau) milik mentor.
   * Berguna untuk halaman kalender atau daftar jadwal.
   */

  async getMySchedules(req, res) {
    try {
      const mentorId = req.user.id;
      const query = `
        SELECT 
          s.schedule_id, 
          s.session_datetime, 
          s.zoom_link,
          u.full_name as student_name
        FROM schedules s
        LEFT JOIN users u ON s.student_id = u.user_id -- <-- PERUBAHAN DARI JOIN MENJADI LEFT JOIN
        WHERE s.mentor_id = $1
        ORDER BY s.session_datetime DESC;
      `;
      const { rows } = await pool.query(query, [mentorId]);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil jadwal mentor:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  /**
   * Menambahkan link meeting (Zoom/GMeet) ke jadwal yang sudah ada.
   */
  async addSessionLink(req, res) {
    try {
      const mentorId = req.user.id;
      const { schedule_id } = req.params;
      const { zoom_link } = req.body;

      if (!zoom_link) {
        return res
          .status(400)
          .json({ message: "Link sesi tidak boleh kosong." });
      }

      const query = `
        UPDATE schedules
        SET zoom_link = $1
        WHERE schedule_id = $2 AND mentor_id = $3
        RETURNING *;
      `;
      const result = await pool.query(query, [
        zoom_link,
        schedule_id,
        mentorId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Jadwal tidak ditemukan atau Anda tidak berhak mengubahnya.",
        });
      }

      res.json({
        message: "Link sesi berhasil ditambahkan.",
        schedule: result.rows[0],
      });
    } catch (error) {
      console.error("Error menambahkan link sesi:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  // =================================================================
  // == FUNGSI UNTUK PELAPORAN SESI (SESSION REPORT) ==
  // =================================================================

  /**
   * Mengambil daftar sesi yang telah selesai namun belum dibuat laporannya.
   */
  async getCompletedSessions(req, res) {
    try {
      const mentorId = req.user.id;
      const query = `
        SELECT 
          s.schedule_id,
          s.session_datetime,
          u.full_name AS student_name
        FROM 
          schedules s
        JOIN 
          users u ON s.student_id = u.user_id
        LEFT JOIN 
          session_reports sr ON s.schedule_id = sr.schedule_id
        WHERE 
          s.mentor_id = $1
          AND s.session_datetime < NOW()
          AND s.status = 'scheduled'
          AND sr.report_id IS NULL
        ORDER BY 
          s.session_datetime DESC;
      `;
      const { rows } = await pool.query(query, [mentorId]);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil sesi selesai:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  /**
   * Membuat laporan sesi setelah kelas selesai.
   */
  async createSessionReport(req, res) {
    try {
      const mentorId = req.user.id;
      const {
        schedule_id,
        summary,
        student_development_journal,
        student_attended,
      } = req.body;

      if (!schedule_id || !summary) {
        return res
          .status(400)
          .json({ message: "Jadwal sesi dan rangkuman wajib diisi." });
      }

      // Cek apakah laporan sudah ada
      const existingReport = await pool.query(
        "SELECT report_id FROM session_reports WHERE schedule_id = $1",
        [schedule_id]
      );
      if (existingReport.rows.length > 0) {
        return res.status(409).json({
          message: "Laporan untuk sesi ini sudah pernah dibuat sebelumnya.",
        });
      }

      // Verifikasi jadwal dan ambil student_id
      const scheduleData = await pool.query(
        "SELECT student_id FROM schedules WHERE schedule_id = $1 AND mentor_id = $2",
        [schedule_id, mentorId]
      );
      if (scheduleData.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Jadwal tidak ditemukan atau bukan milik Anda." });
      }
      const student_id = scheduleData.rows[0].student_id;

      const query = `
        INSERT INTO session_reports (schedule_id, mentor_id, student_id, summary, student_development_journal, student_attended)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const newReport = await pool.query(query, [
        schedule_id,
        mentorId,
        student_id,
        summary,
        student_development_journal,
        student_attended,
      ]);

      res.status(201).json({
        message: "Laporan sesi berhasil dibuat.",
        report: newReport.rows[0],
      });
    } catch (error) {
      console.error("Error membuat laporan sesi:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  // =================================================================
  // == FUNGSI TERKAIT GAJI (PAYROLL) - BIARKAN JIKA DIPERLUKAN ADMIN ==
  // =================================================================

  /**
   * Mengambil data gaji harian mentor yang laporannya sudah diverifikasi.
   * Mungkin lebih cocok di adminController, tapi bisa tetap di sini untuk sementara.
   */
  async getDailyPayroll(req, res) {
    try {
      const query = `
        SELECT
          sr.report_id,
          sr.created_at AS report_date,
          u.user_id AS mentor_id,
          u.full_name,
          u.salary_rate,
          s.session_datetime
        FROM
          session_reports sr
        JOIN
          users u ON sr.mentor_id = u.user_id
        JOIN
          schedules s ON sr.schedule_id = s.schedule_id
        WHERE
          u.payment_type = 'daily'
          AND sr.verified_by_admin = true
          AND sr.payroll_status = 'unpaid'
        ORDER BY
          u.full_name, s.session_datetime;
      `;
      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil data gaji harian:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async updateMySchedule(req, res) {
    try {
      const { schedule_id } = req.params;
      const { session_datetime } = req.body;
      const mentorId = req.user.id;

      if (!session_datetime) {
        return res
          .status(400)
          .json({ message: "Waktu sesi baru wajib diisi." });
      }

      const query = `
      UPDATE schedules
      SET session_datetime = $1
      WHERE schedule_id = $2 AND mentor_id = $3
      RETURNING *;
    `;
      const result = await pool.query(query, [
        session_datetime,
        schedule_id,
        mentorId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Jadwal tidak ditemukan atau Anda tidak berhak mengubahnya.",
        });
      }

      res.json({
        message: "Jadwal berhasil diperbarui.",
        schedule: result.rows[0],
      });
    } catch (error) {
      console.error("Error saat mentor update jadwal:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  /**
   * Mengubah status jadwal menjadi 'cancelled' oleh mentor.
   * Jadwal tidak dihapus, hanya ditandai sebagai batal.
   */
  async cancelSchedule(req, res) {
    try {
      const { schedule_id } = req.params;
      const mentorId = req.user.id;

      const query = `
      UPDATE schedules
      SET status = 'cancelled'
      WHERE schedule_id = $1 AND mentor_id = $2
      RETURNING *;
    `;
      const result = await pool.query(query, [schedule_id, mentorId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Jadwal tidak ditemukan atau Anda tidak berhak membatalkannya.",
        });
      }

      res.json({ message: "Jadwal berhasil dibatalkan." });
    } catch (error) {
      console.error("Error saat mentor membatalkan jadwal:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },
};

module.exports = mentorController;
