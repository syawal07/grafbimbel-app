// backend/routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Pastikan middleware ini sesuai
const studentController = require("../controllers/studentController");
const upload = require("../middleware/upload");

// =======================================================
// == RUTE UTAMA UNTUK SISWA ==
// =======================================================

// BARU: Rute utama untuk mengambil semua jadwal mendatang siswa
router.get("/my-schedules", auth, studentController.getMySchedules);

// Rute untuk mengambil semua riwayat paket siswa
router.get("/my-packages", auth, studentController.getMyPackages);

// Route untuk mengambil riwayat laporan sesi
router.get("/my-reports", auth, studentController.getMyReports);

// Route untuk siswa membeli paket baru
router.post(
  "/purchase-request",
  [auth, upload.single("paymentProof")],
  studentController.createPurchaseRequest
);

// =======================================================
// == RUTE LAMA YANG DIHAPUS ==
// =======================================================
// router.get("/next-schedule", ...); -> Digantikan oleh /my-schedules
// router.post("/request-schedule", ...); -> Alur lama, tidak dipakai lagi

module.exports = router;
