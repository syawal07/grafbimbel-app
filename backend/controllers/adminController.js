// backend/controllers/adminController.js
const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const adminController = {
  // --- FUNGSI UNTUK PENGGUNA ---
  async getAllUsers(req, res) {
    try {
      const { role, search } = req.query;
      let query = `
        SELECT DISTINCT ON (u.user_id)
          u.user_id, u.full_name, u.email, u.role, u.phone_number, u.created_at,
          up.remaining_sessions,
          p.total_sessions
        FROM users u
        LEFT JOIN user_packages up ON u.user_id = up.student_id AND up.status = 'active'
        LEFT JOIN packages p ON up.package_id = p.package_id
        WHERE u.role != 'admin'
      `;
      const queryParams = [];
      if (role) {
        queryParams.push(role);
        query += ` AND u.role = $${queryParams.length}`;
      }
      if (search) {
        queryParams.push(`%${search}%`);
        query += ` AND u.full_name ILIKE $${queryParams.length}`;
      }
      query += ` ORDER BY u.user_id, up.purchase_date DESC;`;
      const { rows } = await pool.query(query, queryParams);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil data semua user:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async createUser(req, res) {
    try {
      const {
        full_name,
        email,
        password,
        role,
        phone_number,
        payment_type, // salary_rate dihapus
      } = req.body;
      if (!full_name || !email || !password || !role) {
        return res
          .status(400)
          .json({ message: "Nama, email, password, dan peran wajib diisi." });
      }
      const userExists = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      if (userExists.rows.length > 0) {
        return res.status(409).json({ message: "Email sudah terdaftar." });
      }
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const query = `
        INSERT INTO users (full_name, email, password_hash, role, phone_number, payment_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING user_id, full_name, email, role;
      `;
      const newUser = await pool.query(query, [
        full_name,
        email,
        password_hash,
        role,
        phone_number,
        payment_type || "monthly",
      ]);
      res
        .status(201)
        .json({ message: "Pengguna berhasil dibuat.", user: newUser.rows[0] });
    } catch (error) {
      console.error("Error membuat user baru:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const query =
        "SELECT user_id, full_name, email, role, phone_number FROM users WHERE user_id = $1";
      const { rows } = await pool.query(query, [id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan." });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error("Error mengambil data user by id:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const {
        full_name,
        email,
        role,
        phone_number,
        payment_type, // salary_rate dihapus
      } = req.body;
      if (!full_name || !email || !role) {
        return res
          .status(400)
          .json({ message: "Nama, email, dan peran wajib diisi." });
      }
      const query = `
        UPDATE users 
        SET full_name = $1, email = $2, role = $3, phone_number = $4, payment_type = $5
        WHERE user_id = $6
        RETURNING user_id, full_name, email, role;
      `;
      const updatedUser = await pool.query(query, [
        full_name,
        email,
        role,
        phone_number,
        payment_type || "monthly",
        id,
      ]);
      if (updatedUser.rows.length === 0) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan." });
      }
      res.json({
        message: "Data pengguna berhasil diperbarui.",
        user: updatedUser.rows[0],
      });
    } catch (error) {
      console.error("Error update user:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "DELETE FROM users WHERE user_id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan." });
      }
      res.json({ message: "Pengguna berhasil dihapus." });
    } catch (error) {
      console.error("Error menghapus pengguna:", error);
      if (error.code === "23503") {
        return res.status(409).json({
          message:
            "Gagal menghapus: Pengguna ini masih memiliki data terkait yang tidak bisa dihapus otomatis.",
        });
      }
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  // --- FUNGSI UNTUK PEMBAYARAN ---
  async getPendingPayments(req, res) {
    try {
      const query = `
        SELECT p.payment_id, p.amount, p.payment_proof_url, p.payment_date, p.student_id,
               u.full_name as student_name, pkg.package_name
        FROM payments p
        JOIN users u ON p.student_id = u.user_id
        JOIN user_packages up ON p.user_package_id = up.user_package_id
        JOIN packages pkg ON up.package_id = pkg.package_id
        WHERE p.status = 'pending'
        ORDER BY p.payment_date ASC;
      `;
      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil pembayaran pending:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async verifyPayment(req, res) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { id } = req.params;
      const { mentor_id, schedule_recommendation, session_rate } = req.body;
      const adminId = req.user.id;

      if (!mentor_id || !schedule_recommendation || !session_rate) {
        throw new Error(
          "Anda harus memilih mentor, mengisi rekomendasi jadwal, dan menentukan tarif sesi."
        );
      }

      const paymentQuery = `
      UPDATE payments SET status = 'verified', verified_by = $1, verified_at = NOW()
      WHERE payment_id = $2 AND status = 'pending'
      RETURNING user_package_id;
    `;
      const paymentResult = await client.query(paymentQuery, [adminId, id]);

      if (paymentResult.rows.length === 0) {
        throw new Error("Pembayaran tidak ditemukan atau sudah diverifikasi.");
      }

      const { user_package_id } = paymentResult.rows[0];

      const packageQuery = `
      UPDATE user_packages 
      SET status = 'active', activation_date = NOW(), mentor_id = $1, schedule_recommendation = $2, session_rate = $3
      WHERE user_package_id = $4;
    `;
      await client.query(packageQuery, [
        mentor_id,
        schedule_recommendation,
        session_rate,
        user_package_id,
      ]);

      await client.query("COMMIT");
      res.json({
        message:
          "Pembayaran berhasil diverifikasi dan mentor telah ditetapkan.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error verifikasi pembayaran:", error);
      res
        .status(500)
        .json({ message: error.message || "Terjadi kesalahan pada server" });
    } finally {
      client.release();
    }
  },

  async getStudentDetails(req, res) {
    try {
      const { id } = req.params;
      const query =
        "SELECT user_id, full_name, email, phone_number FROM users WHERE user_id = $1";
      const { rows } = await pool.query(query, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ message: "Siswa tidak ditemukan." });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error("Error mengambil detail siswa:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
  },

  // --- FUNGSI UNTUK JADWAL ---
  async getGlobalSchedule(req, res) {
    try {
      const { startDate, endDate } = req.query;
      let query = `
      SELECT 
        s.schedule_id, s.session_datetime, s.status, s.zoom_link,
        student.full_name AS student_name,
        mentor.full_name AS mentor_name,
        p.package_name
      FROM schedules s
      LEFT JOIN users student ON s.student_id = student.user_id
      LEFT JOIN users mentor ON s.mentor_id = mentor.user_id
      LEFT JOIN user_packages up ON s.user_package_id = up.user_package_id
      LEFT JOIN packages p ON up.package_id = p.package_id
    `;
      const queryParams = [];
      if (startDate && endDate) {
        queryParams.push(startDate);
        queryParams.push(endDate);
        query += ` WHERE s.session_datetime BETWEEN $1 AND $2`;
      }
      query += ` ORDER BY s.session_datetime DESC;`;
      const { rows } = await pool.query(query, queryParams);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil jadwal global:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async getScheduleRequests(req, res) {
    try {
      const query = `
        SELECT 
          s.schedule_id, s.user_package_id, s.student_id,
          u.full_name AS student_name,
          p.package_name,
          s.session_datetime
        FROM schedules s
        JOIN users u ON s.student_id = u.user_id
        JOIN user_packages up ON s.user_package_id = up.user_package_id
        JOIN packages p ON up.package_id = p.package_id
        WHERE s.status = 'pending_approval'
        ORDER BY s.created_at ASC;
      `;
      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil permintaan jadwal:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async createSchedule(req, res) {
    try {
      const { user_package_id, student_id, mentor_id, session_datetime } =
        req.body;
      if (!user_package_id || !student_id || !mentor_id || !session_datetime) {
        return res.status(400).json({ message: "Semua field wajib diisi." });
      }
      const query = `
        INSERT INTO schedules (user_package_id, student_id, mentor_id, session_datetime, status)
        VALUES ($1, $2, $3, $4, 'scheduled')
        RETURNING *;
      `;
      const newSchedule = await pool.query(query, [
        user_package_id,
        student_id,
        mentor_id,
        session_datetime,
      ]);
      res.status(201).json({
        message: "Jadwal berhasil dibuat.",
        schedule: newSchedule.rows[0],
      });
    } catch (error) {
      console.error("Error membuat jadwal:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async deleteSchedule(req, res) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { id } = req.params;
      await client.query("DELETE FROM session_reports WHERE schedule_id = $1", [
        id,
      ]);
      const result = await client.query(
        "DELETE FROM schedules WHERE schedule_id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        throw new Error("Jadwal tidak ditemukan.");
      }
      await client.query("COMMIT");
      res.json({ message: "Jadwal berhasil dihapus." });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error menghapus jadwal:", error);
      res
        .status(500)
        .json({ message: error.message || "Terjadi kesalahan pada server" });
    } finally {
      client.release();
    }
  },

  async getScheduleById(req, res) {
    try {
      const { id } = req.params;
      const query = `
        SELECT 
          s.schedule_id, s.student_id, s.mentor_id, s.session_datetime,
          u_student.full_name as student_name
        FROM schedules s
        JOIN users u_student ON s.student_id = u_student.user_id
        WHERE s.schedule_id = $1;
      `;
      const { rows } = await pool.query(query, [id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: "Jadwal tidak ditemukan." });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error("Error mengambil data jadwal by id:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      const { mentor_id, session_datetime } = req.body;
      if (!mentor_id || !session_datetime) {
        return res
          .status(400)
          .json({ message: "Mentor dan waktu sesi wajib diisi." });
      }
      const query = `
        UPDATE schedules 
        SET mentor_id = $1, session_datetime = $2, status = 'scheduled'
        WHERE schedule_id = $3
        RETURNING *;
      `;
      const updatedSchedule = await pool.query(query, [
        mentor_id,
        session_datetime,
        id,
      ]);
      if (updatedSchedule.rows.length === 0) {
        return res.status(404).json({ message: "Jadwal tidak ditemukan." });
      }
      res.json({
        message: "Jadwal berhasil diperbarui.",
        schedule: updatedSchedule.rows[0],
      });
    } catch (error) {
      console.error("Error update jadwal:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async getAllMentors(req, res) {
    try {
      const query = `
        SELECT user_id, full_name 
        FROM users 
        WHERE role = 'mentor'
        ORDER BY full_name ASC;
      `;
      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil data mentor:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  // --- FUNGSI UNTUK LAPORAN SESI ---
  async getUnverifiedReports(req, res) {
    try {
      const query = `
        SELECT sr.report_id, sr.summary, sr.student_attended, sr.created_at, s.session_datetime,
               m.full_name as mentor_name, st.full_name as student_name
        FROM session_reports sr
        JOIN schedules s ON sr.schedule_id = s.schedule_id
        JOIN users m ON sr.mentor_id = m.user_id
        JOIN users st ON sr.student_id = st.user_id
        WHERE sr.verified_by_admin = false
        ORDER BY sr.created_at ASC;
      `;
      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil laporan belum terverifikasi:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async verifySessionReport(req, res) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { report_id } = req.params;
      const reportQuery = `
        UPDATE session_reports
        SET verified_by_admin = true
        WHERE report_id = $1 AND verified_by_admin = false
        RETURNING schedule_id;
      `;
      const reportResult = await client.query(reportQuery, [report_id]);
      if (reportResult.rows.length === 0) {
        throw new Error("Laporan tidak ditemukan atau sudah diverifikasi.");
      }
      const { schedule_id } = reportResult.rows[0];
      const scheduleResult = await client.query(
        "SELECT user_package_id FROM schedules WHERE schedule_id = $1",
        [schedule_id]
      );
      if (
        scheduleResult.rows.length > 0 &&
        scheduleResult.rows[0].user_package_id
      ) {
        const { user_package_id } = scheduleResult.rows[0];
        const deductSessionQuery = `
          UPDATE user_packages
          SET remaining_sessions = remaining_sessions - 1
          WHERE user_package_id = $1 AND remaining_sessions > 0;
        `;
        await client.query(deductSessionQuery, [user_package_id]);
      }
      await client.query("COMMIT");
      res.json({
        message: "Laporan berhasil diverifikasi dan sisa sesi telah dikurangi.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error verifikasi laporan:", error);
      res
        .status(500)
        .json({ message: error.message || "Terjadi kesalahan pada server" });
    } finally {
      client.release();
    }
  },

  // --- FUNGSI UNTUK PAKET BIMBEL ---
  async getAllPackages(req, res) {
    try {
      const query = `SELECT * FROM packages ORDER BY price ASC`;
      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil data paket:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async createPackage(req, res) {
    try {
      const {
        package_name,
        description,
        price,
        total_sessions,
        duration_days,
        curriculum,
      } = req.body;
      if (
        !package_name ||
        !price ||
        !total_sessions ||
        !duration_days ||
        !curriculum
      ) {
        return res.status(400).json({ message: "Semua field wajib diisi." });
      }
      const query = `
        INSERT INTO packages (package_name, description, price, total_sessions, duration_days, curriculum)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const newPackage = await pool.query(query, [
        package_name,
        description,
        price,
        total_sessions,
        duration_days,
        curriculum,
      ]);
      res.status(201).json({
        message: "Paket berhasil dibuat.",
        package: newPackage.rows[0],
      });
    } catch (error) {
      console.error("Error membuat paket baru:", error);
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
      console.error("Error mengambil data paket by id:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async updatePackage(req, res) {
    try {
      const { id } = req.params;
      const {
        package_name,
        description,
        price,
        total_sessions,
        duration_days,
        curriculum,
      } = req.body;
      if (
        !package_name ||
        !price ||
        !total_sessions ||
        !duration_days ||
        !curriculum
      ) {
        return res.status(400).json({ message: "Semua field wajib diisi." });
      }
      const query = `
        UPDATE packages 
        SET package_name = $1, description = $2, price = $3, total_sessions = $4, duration_days = $5, curriculum = $6
        WHERE package_id = $7
        RETURNING *;
      `;
      const updatedPackage = await pool.query(query, [
        package_name,
        description,
        price,
        total_sessions,
        duration_days,
        curriculum,
        id,
      ]);
      if (updatedPackage.rows.length === 0) {
        return res.status(404).json({ message: "Paket tidak ditemukan." });
      }
      res.json({
        message: "Data paket berhasil diperbarui.",
        package: updatedPackage.rows[0],
      });
    } catch (error) {
      console.error("Error update paket:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async deletePackage(req, res) {
    try {
      const { id } = req.params;
      const checkUsage = await pool.query(
        "SELECT 1 FROM user_packages WHERE package_id = $1 LIMIT 1",
        [id]
      );
      if (checkUsage.rows.length > 0) {
        return res.status(409).json({
          message:
            "Gagal menghapus: Paket ini sudah digunakan oleh siswa dan tidak dapat dihapus.",
        });
      }
      const result = await pool.query(
        "DELETE FROM packages WHERE package_id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Paket tidak ditemukan." });
      }
      res.json({ message: "Paket bimbel berhasil dihapus." });
    } catch (error) {
      console.error("Error menghapus paket:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  // --- FUNGSI UNTUK LAPORAN KEUANGAN & DASHBOARD ---
  async getFinancialReport(req, res) {
    try {
      const query = `
        SELECT COUNT(*) as total_transactions, SUM(amount) as total_revenue
        FROM payments
        WHERE status = 'verified';
      `;
      const { rows } = await pool.query(query);
      res.json(rows[0]);
    } catch (error) {
      console.error("Error mengambil laporan keuangan:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async getDashboardSummary(req, res) {
    try {
      const studentQuery = "SELECT COUNT(*) FROM users WHERE role = 'siswa'";
      const mentorQuery = "SELECT COUNT(*) FROM users WHERE role = 'mentor'";
      const pendingPaymentQuery =
        "SELECT COUNT(*) FROM payments WHERE status = 'pending'";
      const todaySessionQuery = `
        SELECT COUNT(*) FROM schedules 
        WHERE session_datetime >= date_trunc('day', NOW()) 
          AND session_datetime < date_trunc('day', NOW()) + interval '1 day'
      `;

      const [studentRes, mentorRes, paymentRes, sessionRes] = await Promise.all(
        [
          pool.query(studentQuery),
          pool.query(mentorQuery),
          pool.query(pendingPaymentQuery),
          pool.query(todaySessionQuery),
        ]
      );

      const summary = {
        activeStudents: parseInt(studentRes.rows[0].count, 10),
        activeMentors: parseInt(mentorRes.rows[0].count, 10),
        pendingPayments: parseInt(paymentRes.rows[0].count, 10),
        upcomingSessions: parseInt(sessionRes.rows[0].count, 10),
      };

      res.json(summary);
    } catch (error) {
      console.error("Error mengambil data ringkasan dashboard:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async getPayrollReport(req, res) {
    // Untuk Gaji Bulanan
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Rentang tanggal (startDate dan endDate) wajib diisi.",
        });
      }
      const query = `
            SELECT
                u.user_id AS mentor_id,
                u.full_name,
                COUNT(sr.report_id) AS verified_sessions,
                SUM(COALESCE(up.session_rate, s.session_rate)) AS total_salary
            FROM
                users u
            JOIN
                session_reports sr ON u.user_id = sr.mentor_id
            JOIN
                schedules s ON sr.schedule_id = s.schedule_id
            LEFT JOIN
                user_packages up ON s.user_package_id = up.user_package_id
            WHERE
                u.role = 'mentor' AND u.payment_type = 'monthly'
                AND sr.verified_by_admin = true
                AND s.session_datetime BETWEEN $1 AND $2
            GROUP BY
                u.user_id, u.full_name
            ORDER BY
                u.full_name ASC;
        `;
      const { rows } = await pool.query(query, [startDate, endDate]);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil laporan gaji bulanan:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async getDailyPayroll(req, res) {
    // Untuk Gaji Harian
    try {
      const { startDate, endDate } = req.query;
      let query = `
            SELECT
                sr.report_id,
                sr.created_at AS report_date,
                u.user_id AS mentor_id,
                u.full_name,
                s.session_datetime,
                COALESCE(up.session_rate, s.session_rate) AS session_rate
            FROM
                session_reports sr
            JOIN
                users u ON sr.mentor_id = u.user_id
            JOIN
                schedules s ON sr.schedule_id = s.schedule_id
            LEFT JOIN
                user_packages up ON s.user_package_id = up.user_package_id
            WHERE
                u.payment_type = 'daily'
                AND sr.verified_by_admin = true
                AND sr.payroll_status = 'unpaid'
        `;
      const queryParams = [];
      if (startDate && endDate) {
        queryParams.push(startDate);
        queryParams.push(endDate);
        query += ` AND s.session_datetime BETWEEN $1 AND $2`;
      }
      query += ` ORDER BY u.full_name, s.session_datetime;`;
      const { rows } = await pool.query(query, queryParams);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil data gaji harian:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async getInactiveStudents(req, res) {
    try {
      const query = `
        SELECT 
          u.user_id, u.full_name, u.email, u.phone_number,
          up.status AS package_status
        FROM users u
        JOIN user_packages up ON u.user_id = up.student_id
        WHERE u.role = 'siswa' AND up.status IN ('completed', 'expired')
        ORDER BY u.full_name ASC;
      `;
      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error("Error mengambil data siswa paket habis:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async getStudentProfile(req, res) {
    try {
      const { id } = req.params;
      const studentInfoPromise = pool.query(
        "SELECT user_id, full_name, email, phone_number, created_at FROM users WHERE user_id = $1 AND role = 'siswa'",
        [id]
      );
      const packageHistoryPromise = pool.query(
        `SELECT up.user_package_id, p.package_name, up.status, up.remaining_sessions, p.total_sessions
       FROM user_packages up
       JOIN packages p ON up.package_id = p.package_id
       WHERE up.student_id = $1
       ORDER BY up.purchase_date DESC`,
        [id]
      );
      const sessionHistoryPromise = pool.query(
        `SELECT s.schedule_id, s.session_datetime, u.full_name AS mentor_name, sr.summary
       FROM schedules s
       JOIN users u ON s.mentor_id = u.user_id
       LEFT JOIN session_reports sr ON s.schedule_id = sr.schedule_id AND sr.verified_by_admin = true
       WHERE s.student_id = $1 AND s.status != 'pending_approval'
       ORDER BY s.session_datetime DESC`,
        [id]
      );
      const [studentInfoRes, packageHistoryRes, sessionHistoryRes] =
        await Promise.all([
          studentInfoPromise,
          packageHistoryPromise,
          sessionHistoryPromise,
        ]);
      if (studentInfoRes.rows.length === 0) {
        return res.status(404).json({ message: "Siswa tidak ditemukan." });
      }
      const profileData = {
        student: studentInfoRes.rows[0],
        packageHistory: packageHistoryRes.rows,
        sessionHistory: sessionHistoryRes.rows,
      };
      res.json(profileData);
    } catch (error) {
      console.error("Error mengambil profil siswa:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async createOnDemandSchedule(req, res) {
    try {
      const { student_id, mentor_id, session_datetime, session_rate, mapel } =
        req.body;
      if (
        !student_id ||
        !mentor_id ||
        !session_datetime ||
        !session_rate ||
        !mapel
      ) {
        return res.status(400).json({ message: "Semua field wajib diisi." });
      }
      const query = `
      INSERT INTO schedules (student_id, mentor_id, session_datetime, status, session_rate, mapel)
      VALUES ($1, $2, $3, 'scheduled', $4, $5)
      RETURNING *;
    `;
      const newSchedule = await pool.query(query, [
        student_id,
        mentor_id,
        session_datetime,
        session_rate,
        mapel,
      ]);
      res.status(201).json({
        message: "Jadwal harian (on-demand) berhasil dibuat.",
        schedule: newSchedule.rows[0],
      });
    } catch (error) {
      console.error("Error membuat jadwal on-demand:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async getMentorProfile(req, res) {
    try {
      const { id } = req.params;
      const mentorInfoPromise = pool.query(
        `SELECT 
          u.user_id, u.full_name, u.email, u.phone_number, u.payment_type,
          mp.* FROM users u
        LEFT JOIN mentor_profiles mp ON u.user_id = mp.mentor_id
        WHERE u.user_id = $1 AND u.role = 'mentor'`,
        [id]
      );
      const scheduleHistoryPromise = pool.query(
        `SELECT 
           s.schedule_id, s.session_datetime, s.status,
           u.full_name AS student_name,
           COALESCE(up.session_rate, s.session_rate) AS session_rate,
           sr.payroll_status
         FROM schedules s
         LEFT JOIN users u ON s.student_id = u.user_id
         LEFT JOIN user_packages up ON s.user_package_id = up.user_package_id
         LEFT JOIN session_reports sr ON s.schedule_id = sr.schedule_id
         WHERE s.mentor_id = $1
         ORDER BY s.session_datetime DESC`,
        [id]
      );
      const [mentorInfoRes, scheduleHistoryRes] = await Promise.all([
        mentorInfoPromise,
        scheduleHistoryPromise,
      ]);
      if (mentorInfoRes.rows.length === 0) {
        return res.status(404).json({ message: "Mentor tidak ditemukan." });
      }
      const profileData = {
        mentor: mentorInfoRes.rows[0],
        scheduleHistory: scheduleHistoryRes.rows,
      };
      res.json(profileData);
    } catch (error) {
      console.error("Error mengambil profil mentor:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },

  async changeMentor(req, res) {
    try {
      const { id } = req.params;
      const { new_mentor_id } = req.body;
      if (!new_mentor_id) {
        return res.status(400).json({ message: "Mentor baru wajib dipilih." });
      }
      const query = `
      UPDATE user_packages
      SET mentor_id = $1
      WHERE user_package_id = $2
      RETURNING *;
    `;
      const result = await pool.query(query, [new_mentor_id, id]);
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Paket siswa tidak ditemukan." });
      }
      res.json({
        message: "Mentor berhasil diganti.",
        updatedPackage: result.rows[0],
      });
    } catch (error) {
      console.error("Error saat mengganti mentor:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },
  async markDailyPayrollAsPaid(req, res) {
    try {
      const { report_id } = req.params;

      const query = `
        UPDATE session_reports
        SET payroll_status = 'paid'
        WHERE report_id = $1 AND payroll_status = 'unpaid'
        RETURNING report_id;
      `;

      const { rows } = await pool.query(query, [report_id]);

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Laporan tidak ditemukan atau sudah dibayar." });
      }

      res.json({
        message: "Gaji untuk sesi ini telah berhasil ditandai sebagai lunas.",
      });
    } catch (error) {
      console.error("Error menandai gaji harian:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  },
};

module.exports = adminController;
