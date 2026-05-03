import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import destinationRoutes from "./routes/destinationRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import path from "path";
import tourRoutes from "./routes/tourRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import guideRoutes from "./routes/guideRoutes.js";
import guideReservationRoutes from "./routes/guideReservationRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    console.log(`Response: ${res.statusCode}`);
  });
  next();
});
// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "Backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/tour-packages", tourRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/guides", guideRoutes);
app.use("/api/guide-reservations", guideReservationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack,
      ...err
    } : {}
  });
});

export default app;