// backend/server.js (versi final)

const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const packageRoutes = require("./routes/packageRoutes");
const publicRoutes = require("./routes/publicRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.status(200).send("<h1>Selamat Datang di API Graf Bimbel!</h1>");
});

// Gunakan Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes); // <-- PERBAIKAN DI SINI
app.use("/api/packages", packageRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/public", publicRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
