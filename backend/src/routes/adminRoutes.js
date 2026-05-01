import express from "express";
import { getAllUsers, toggleUserStatus } from "../controller/adminController.js";
import { createTourPackage, getAllTourPackages, getTourPackageById, updateTourPackage, deleteTourPackage } from "../controller/tourPackageController.js";
import { adminGetAllHotels, adminDeleteHotel } from "../controller/hotelController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get("/users", protect, adminOnly, getAllUsers);
router.put("/users/:id/toggle", protect, adminOnly, toggleUserStatus);

// Admin: tour package routes
router.get('/tour-packages', protect, adminOnly, getAllTourPackages);
router.post('/tour-packages', protect, adminOnly, upload.single('cover'), createTourPackage);
router.get('/tour-packages/:id', protect, adminOnly, getTourPackageById);
router.put('/tour-packages/:id', protect, adminOnly, upload.single('cover'), updateTourPackage);
router.delete('/tour-packages/:id', protect, adminOnly, deleteTourPackage);

// Admin: hotel management routes
router.get('/hotels', protect, adminOnly, adminGetAllHotels);
router.delete('/hotels/:id', protect, adminOnly, adminDeleteHotel);

export default router;
