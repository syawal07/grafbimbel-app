const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Sesuaikan path jika perlu
const mentorAuth = require("../middleware/mentorAuth"); // Sesuaikan path jika perlu
const mentorController = require("../controllers/mentorController");

// =======================================================
// == RUTE UTAMA UNTUK ALUR PENJADWALAN BARU ==
// =======================================================

// BARU: Mengambil daftar paket siswa yang ditugaskan ke mentor (menggantikan /my-students)
router.get(
  "/assigned-packages",
  [auth, mentorAuth],
  mentorController.getAssignedPackages
);

// BARU: Mentor membuat jadwal baru untuk siswa dari paket yang ditugaskan
router.post("/schedules", [auth, mentorAuth], mentorController.createSchedule);

// =======================================================
// == RUTE LAIN YANG SUDAH ADA (TETAP DIPERTAHANKAN) ==
// =======================================================

// Mengambil semua jadwal (mendatang & lampau) untuk ditampilkan di kalender mentor
router.get(
  "/my-schedules",
  [auth, mentorAuth],
  mentorController.getMySchedules
);

// Menambahkan link Zoom/GMeet ke jadwal spesifik
router.put(
  "/schedules/:schedule_id/link",
  [auth, mentorAuth],
  mentorController.addSessionLink
);

// Mengambil sesi yang sudah selesai untuk dibuatkan laporan
router.get(
  "/sessions-for-reporting",
  [auth, mentorAuth],
  mentorController.getCompletedSessions
);

// Mengirim laporan sesi yang baru dibuat
router.post(
  "/reports",
  [auth, mentorAuth],
  mentorController.createSessionReport
);

// Rute untuk mentor mengedit jadwalnya sendiri
router.put(
  "/my-schedules/:schedule_id",
  [auth, mentorAuth], // atau middleware auth Anda
  mentorController.updateMySchedule
);

// Rute untuk mentor membatalkan jadwalnya sendiri
router.put(
  "/my-schedules/:schedule_id/cancel",
  [auth, mentorAuth], // atau middleware auth Anda
  mentorController.cancelSchedule
);

module.exports = router;
