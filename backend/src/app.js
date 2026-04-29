import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (_req, res) => {
	res.status(200).json({ message: "Backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/upload", uploadRoutes);

export default app;