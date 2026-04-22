import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import destinationRoutes from "./routes/destinationRoutes.js";

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

app.get("/api/health", (_req, res) => {
	res.status(200).json({ message: "Backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/destinations", destinationRoutes);

export default app;