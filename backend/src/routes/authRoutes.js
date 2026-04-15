import express from "express";
import { loginUser, registerUser, updateUserProfile } from "../controller/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/profile/:id", updateUserProfile);

export default router;
