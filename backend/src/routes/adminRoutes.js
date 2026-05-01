import express from "express";
import { getAllUsers, toggleUserStatus } from "../controller/adminController.js";
import { createTourPackage, getAllTourPackages, getTourPackageById, updateTourPackage, deleteTourPackage } from "../controller/tourPackageController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/users", protect, adminOnly, getAllUsers);
router.put("/users/:id/toggle", protect, adminOnly, toggleUserStatus);

// Admin: tour package routes
router.get('/tour-packages', protect, adminOnly, getAllTourPackages);
router.post('/tour-packages', protect, adminOnly, createTourPackage);
router.get('/tour-packages/:id', protect, adminOnly, getTourPackageById);
router.put('/tour-packages/:id', protect, adminOnly, updateTourPackage);
router.delete('/tour-packages/:id', protect, adminOnly, deleteTourPackage);

export default router;
