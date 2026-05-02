import express from 'express';
import {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateReservationStatus,
  cancelReservation,
  updateReservation,
  getReservationById,
} from '../controller/reservationController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { uploadDoc } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// User & Admin routes
router.post('/', protect, uploadDoc.single('document'), createReservation);
router.get('/my', protect, getMyReservations);
router.get('/:id', protect, getReservationById);
router.put('/:id', protect, uploadDoc.single('document'), updateReservation);

// Admin-only routes
router.get('/', protect, adminOnly, getAllReservations);
router.put('/:id/status', protect, adminOnly, updateReservationStatus);

// User-specific cancellation
router.put('/:id/cancel', protect, cancelReservation);

export default router;
