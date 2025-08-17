// backend/routes/packageRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const packageController = require("../controllers/packageController");

// Route untuk mengambil semua paket (sudah ada)
router.get("/", auth, packageController.getAll);

// --- ROUTE BARU DITAMBAHKAN DI SINI ---
// Route ini hanya butuh 'auth' (login), tidak butuh 'adminAuth'
router.get("/:id", auth, packageController.getById);

module.exports = router;
