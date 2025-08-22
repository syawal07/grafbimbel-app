// backend/routes/publicRoutes.js
const express = require("express");
const router = express.Router();
const publicController = require("../controllers/publicController");
const contentController = require("../controllers/contentController");


// Route publik untuk mengambil semua paket
router.get("/packages", publicController.getPublicPackages);
router.get("/packages/:id", publicController.getPackageById);

router.get("/advantages", contentController.getAdvantages);
router.get("/faqs", contentController.getFaqs);

module.exports = router;
