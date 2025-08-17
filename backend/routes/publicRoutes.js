// backend/routes/publicRoutes.js
const express = require("express");
const router = express.Router();
const publicController = require("../controllers/publicController");

// Route publik untuk mengambil semua paket
router.get("/packages", publicController.getPublicPackages);
router.get("/packages/:id", publicController.getPackageById);

module.exports = router;
