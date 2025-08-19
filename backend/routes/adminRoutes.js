// backend/routes/adminRoutes.js (Versi Revisi Final)
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");

// --- Routes untuk Ringkasan ---
router.get(
  "/dashboard-summary",
  [auth, adminAuth],
  adminController.getDashboardSummary
);

// --- Routes untuk Pengguna ---
router.get("/users", [auth, adminAuth], adminController.getAllUsers);
router.post("/users", [auth, adminAuth], adminController.createUser);
router.get(
  "/users/student-profile/:id",
  [auth, adminAuth],
  adminController.getStudentProfile
);

router.get(
  "/mentors/:id/profile",
  [auth, adminAuth],
  adminController.getMentorProfile
);

router.get(
  "/users/inactive",
  [auth, adminAuth],
  adminController.getInactiveStudents
);
router.get("/users/:id", [auth, adminAuth], adminController.getUserById);
router.put("/users/:id", [auth, adminAuth], adminController.updateUser);
router.delete("/users/:id", [auth, adminAuth], adminController.deleteUser);

// --- Routes untuk Pembayaran ---
router.get(
  "/payments/pending",
  [auth, adminAuth],
  adminController.getPendingPayments
);
router.put(
  "/payments/:id/verify",
  [auth, adminAuth],
  adminController.verifyPayment
);

// --- Routes untuk Jadwal ---

// BARU: Rute utama untuk mengambil semua jadwal (Jadwal Global)
router.get("/schedules", [auth, adminAuth], adminController.getGlobalSchedule);

router.get(
  "/schedules/requests",
  [auth, adminAuth],
  adminController.getScheduleRequests
);
router.get(
  "/schedules/by-date",
  [auth, adminAuth],
  adminController.getDailySchedules
);
router.get(
  "/tutors/:id/profile",
  [auth, adminAuth],
  adminController.getTutorProfile
);

// Route dinamis di paling bawah grupnya
router.get(
  "/schedules/:id",
  [auth, adminAuth],
  adminController.getScheduleById
);
router.post("/schedules", [auth, adminAuth], adminController.createSchedule);
router.put("/schedules/:id", [auth, adminAuth], adminController.updateSchedule);
router.delete(
  "/schedules/:id",
  [auth, adminAuth],
  adminController.deleteSchedule
);

// --- Routes untuk Mentor ---
router.get("/mentors", [auth, adminAuth], adminController.getAllMentors);

// --- Routes untuk Laporan ---
router.get(
  "/reports/unverified",
  [auth, adminAuth],
  adminController.getUnverifiedReports
);
router.put(
  "/reports/:report_id/verify",
  [auth, adminAuth],
  adminController.verifySessionReport
);

// --- Routes untuk Paket Bimbel ---
router.get("/packages", [auth, adminAuth], adminController.getAllPackages);
router.post("/packages", [auth, adminAuth], adminController.createPackage);
router.get("/packages/:id", [auth, adminAuth], adminController.getPackageById);
router.put("/packages/:id", [auth, adminAuth], adminController.updatePackage);
router.delete(
  "/packages/:id",
  [auth, adminAuth],
  adminController.deletePackage
);

// --- Routes untuk Laporan Keuangan & Gaji ---
router.get(
  "/reports/financial",
  [auth, adminAuth],
  adminController.getFinancialReport
);
router.get(
  "/payroll-report",
  [auth, adminAuth],
  adminController.getPayrollReport
);
router.get(
  "/payroll-daily",
  [auth, adminAuth],
  adminController.getDailyPayroll
);
router.put(
  "/payroll-daily/mark-paid/:report_id",
  [auth, adminAuth],
  adminController.markDailyPayrollAsPaid
);

// BARU: Rute untuk membuat jadwal harian (on-demand)
router.post(
  "/schedules/on-demand",
  [auth, adminAuth], // atau middleware auth Anda
  adminController.createOnDemandSchedule
);

module.exports = router;
