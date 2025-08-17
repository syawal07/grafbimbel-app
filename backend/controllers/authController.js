const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authController = {
  // --- FUNGSI REGISTER ---
  async register(req, res) {
    try {
      console.log("Menerima request register:", req.body);

      const { full_name, email, password, phone_number, role } = req.body;

      // Validasi data
      if (!full_name || !email || !password || !phone_number || !role) {
        return res.status(400).json({ message: "Semua data wajib diisi." });
      }

      // Cek apakah user dengan email ini sudah ada
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Email sudah digunakan." });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Simpan user sesuai role
      let newUser;
      if (role === "admin") {
        newUser = await User.createAdmin({
          full_name,
          email,
          password_hash: hashedPassword,
          phone_number,
        });
      } else if (role === "mentor") {
        newUser = await User.createMentor({
          full_name,
          email,
          password_hash: hashedPassword,
          phone_number,
        });
      } else if (role === "siswa") {
        newUser = await User.createUser({
          full_name,
          email,
          password_hash: hashedPassword,
          phone_number,
        });
      } else {
        return res.status(400).json({ message: "Role tidak valid." });
      }

      console.log("User berhasil dibuat:", newUser);

      res.status(201).json({
        message: "Registrasi berhasil!",
        user: newUser,
      });
    } catch (error) {
      console.error("Error saat register:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat registrasi." });
    }
  },

  // --- FUNGSI LOGIN ---
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email dan password wajib diisi." });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Email atau password salah." });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: "Email atau password salah." });
      }

      const payload = {
        user: {
          id: user.user_id,
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
        (err, token) => {
          if (err) throw err;
          res.json({
            message: "Login berhasil!",
            token,
            user: {
              id: user.user_id,
              full_name: user.full_name,
              email: user.email,
              role: user.role,
            },
          });
        }
      );
    } catch (error) {
      console.error("Error pada login:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
  },
};

module.exports = authController;
