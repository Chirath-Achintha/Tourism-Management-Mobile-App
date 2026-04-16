import express from "express";
import { getAllUsers, toggleUserStatus } from "../controller/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/users", protect, adminOnly, getAllUsers);
router.put("/users/:id/toggle", protect, adminOnly, toggleUserStatus);

export default router;
