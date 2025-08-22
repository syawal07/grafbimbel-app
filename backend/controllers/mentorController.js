// backend/controllers/mentorController.js (Versi Final yang Benar)
const pool = require("../config/db");

const mentorController = {
  // =================================================================
  // == FUNGSI UNTUK ALUR PENJADWALAN BARU ==
  // =================================================================

  async getAssignedPackages(req, res) {
    try {
      const mentorId = req.user.id;
      const query = `
        SELECT 
          up.user_package_id,
          up.schedule_recommendation,
          u.user_id AS student_id,
          u.full_name AS student_name,
          p.package_name
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

  async createSchedule(req, res) {
    try {
      const mentorId = req.user.id;
      const {
        student_id,
        user_package_id,
        session_datetime,
        zoom_link,
        mapel,
      } = req.body;

      if (!student_id || !user_package_id || !session_datetime) {
        return res
          .status(400)
          .json({ message: "Siswa, paket, dan waktu sesi wajib diisi." });
      }

      const query = `
        INSERT INTO schedules (student_id, mentor_id, user_package_id, session_datetime, zoom_link, status, mapel)
        VALUES ($1, $2, $3, $4, $5, 'scheduled', $6)
        RETURNING *;
      `;
      const { rows } = await pool.query(query, [
        student_id,
        mentorId,
        user_package_id,
        session_datetime,
        zoom_link,
        mapel,
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
  // == FUNGSI MANAJEMEN JADWAL & SESI ==
  // =================================================================

  async getMySchedules(req, res) {
    try {
      const mentorId = req.user.id;
      const query = `
        SELECT 
          s.schedule_id, 
          s.session_datetime, 
          s.status,
          s.mapel,
          u.full_name as student_name,
          COALESCE(up.session_rate, s.session_rate) AS session_rate,
          sr.payroll_status,
          sr.summary,
          sr.material_url
        FROM schedules s
        LEFT JOIN users u ON s.student_id = u.user_id
        LEFT JOIN user_packages up ON s.user_package_id = up.user_package_id
        LEFT JOIN session_reports sr ON s.schedule_id = sr.schedule_id
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

  // =================================================================
  // == FUNGSI UNTUK PELAPORAN SESI ==
  // =================================================================

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

  async createSessionReport(req, res) {
    try {
      const mentorId = req.user.id;
      const {
        schedule_id,
        summary,
        student_development_journal,
        student_attended,
      } = req.body;

      const material_url = req.file ? req.file.path.replace(/\\/g, "/") : null;

      if (!schedule_id || !summary) {
        return res
          .status(400)
          .json({ message: "Jadwal sesi dan rangkuman wajib diisi." });
      }

      const existingReport = await pool.query(
        "SELECT report_id FROM session_reports WHERE schedule_id = $1",
        [schedule_id]
      );

      if (existingReport.rows.length > 0) {
        return res.status(409).json({
          message: "Laporan untuk sesi ini sudah pernah dibuat sebelumnya.",
        });
      }

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
      INSERT INTO session_reports (schedule_id, mentor_id, student_id, summary, student_development_journal, student_attended, material_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
      const newReport = await pool.query(query, [
        schedule_id,
        mentorId,
        student_id,
        summary,
        student_development_journal,
        student_attended,
        material_url,
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
  // == FUNGSI PROFIL MENTOR ==
  // =================================================================

  async getMyProfile(req, res) {
    try {
      const mentorId = req.user.id;
      const query = `
      SELECT 
        u.user_id, u.full_name, u.email, u.phone_number,
        mp.* FROM users u
      LEFT JOIN mentor_profiles mp ON u.user_id = mp.mentor_id
      WHERE u.user_id = $1;
    `;
      const { rows } = await pool.query(query, [mentorId]);

      if (rows.length === 0) {
        return res.status(404).json({ message: "Profil tidak ditemukan." });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error("Error mengambil profil mentor:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
  },

  async updateMyProfile(req, res) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const mentorId = req.user.id;

      const {
        full_name,
        phone_number,
        nickname,
        date_of_birth,
        gender,
        domicile,
        last_education,
        major,
        expert_subjects,
        teachable_levels,
        teaching_experience,
        availability,
        max_teaching_hours,
        teaching_mode,
        bank_account_number,
        bank_name,
        id_card_number,
      } = req.body;

      const new_profile_picture_url =
        req.files?.profile_picture?.[0]?.path.replace(/\\/g, "/") || null;
      const new_certificate_url =
        req.files?.certificate?.[0]?.path.replace(/\\/g, "/") || null;

      const userQuery = `
      UPDATE users SET full_name = $1, phone_number = $2 WHERE user_id = $3;
    `;
      await client.query(userQuery, [full_name, phone_number, mentorId]);

      const existingProfile = await client.query(
        "SELECT profile_picture_url, certificate_url FROM mentor_profiles WHERE mentor_id = $1",
        [mentorId]
      );

      const subjectsArray = expert_subjects
        ? `{${expert_subjects
            .split(",")
            .map((s) => `"${s.trim()}"`)
            .join(",")}}`
        : null;
      const levelsArray = teachable_levels
        ? `{${teachable_levels
            .split(",")
            .map((l) => `"${l.trim()}"`)
            .join(",")}}`
        : null;

      if (existingProfile.rows.length > 0) {
        const oldProfile = existingProfile.rows[0];
        const profileQuery = `
              UPDATE mentor_profiles SET
                  nickname = $1, date_of_birth = $2, gender = $3, domicile = $4, last_education = $5, 
                  major = $6, expert_subjects = $7, teachable_levels = $8, teaching_experience = $9, 
                  availability = $10, max_teaching_hours = $11, teaching_mode = $12, bank_account_number = $13, 
                  bank_name = $14, id_card_number = $15, 
                  profile_picture_url = $16, 
                  certificate_url = $17
              WHERE mentor_id = $18;
          `;
        await client.query(profileQuery, [
          nickname,
          date_of_birth || null,
          gender,
          domicile,
          last_education,
          major,
          subjectsArray,
          levelsArray,
          teaching_experience,
          availability,
          max_teaching_hours || null,
          teaching_mode,
          bank_account_number,
          bank_name,
          id_card_number,
          new_profile_picture_url || oldProfile.profile_picture_url,
          new_certificate_url || oldProfile.certificate_url,
          mentorId,
        ]);
      } else {
        const profileQuery = `
              INSERT INTO mentor_profiles (
                  mentor_id, nickname, date_of_birth, gender, domicile, last_education, 
                  major, expert_subjects, teachable_levels, teaching_experience, 
                  availability, max_teaching_hours, teaching_mode, bank_account_number, 
                  bank_name, id_card_number, profile_picture_url, certificate_url
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);
          `;
        await client.query(profileQuery, [
          mentorId,
          nickname,
          date_of_birth || null,
          gender,
          domicile,
          last_education,
          major,
          subjectsArray,
          levelsArray,
          teaching_experience,
          availability,
          max_teaching_hours || null,
          teaching_mode,
          bank_account_number,
          bank_name,
          id_card_number,
          new_profile_picture_url,
          new_certificate_url,
        ]);
      }

      await client.query("COMMIT");
      res.json({ message: "Profil berhasil diperbarui." });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error memperbarui profil mentor:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server." });
    } finally {
      client.release();
    }
  },
};

module.exports = mentorController;
