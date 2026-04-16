import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
	res.status(200).json({ message: "Backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

export default app;