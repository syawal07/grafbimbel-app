// backend/routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Impor middleware
const dashboardController = require("../controllers/dashboardController");

// GET /api/dashboard/siswa (dilindungi oleh middleware 'auth')
router.get("/siswa", auth, dashboardController.getSiswaDashboard);

module.exports = router;
