// backend/routes/adminRoutes.js (Versi Final yang Dirapikan)
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");
const contentController = require("../controllers/contentController");


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
  "/users/:id/details",
  [auth, adminAuth],
  adminController.getStudentDetails
);
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
router.get("/schedules", [auth, adminAuth], adminController.getGlobalSchedule);
router.post(
  "/schedules/on-demand",
  [auth, adminAuth],
  adminController.createOnDemandSchedule
);
router.get(
  "/schedules/requests",
  [auth, adminAuth],
  adminController.getScheduleRequests
);
// router.get(
//   "/schedules/by-date",
//   [auth, adminAuth],
//   adminController.getDailySchedules
// );
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
router.put(
  "/user-packages/:id/change-mentor",
  [auth, adminAuth],
  adminController.changeMentor
);
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

// --- Routes untuk Manajemen Konten ---
router.post('/advantages', [auth, adminAuth], contentController.createAdvantage);
router.put('/advantages/:id', [auth, adminAuth], contentController.updateAdvantage);
router.delete('/advantages/:id', [auth, adminAuth], contentController.deleteAdvantage);

router.post('/faqs', [auth, adminAuth], contentController.createFaq);
router.put('/faqs/:id', [auth, adminAuth], contentController.updateFaq);
router.delete('/faqs/:id', [auth, adminAuth], contentController.deleteFaq);

module.exports = router;
