// backend/routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Endpoint registrasi (sudah ada)
router.post("/register", authController.register);

// --- TAMBAHKAN ROUTE LOGIN DI BAWAH INI ---
router.post("/login", authController.login);

module.exports = router;
