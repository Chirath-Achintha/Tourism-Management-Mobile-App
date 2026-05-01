import express from 'express';
import {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateReservationStatus,
  cancelReservation,
} from '../controller/reservationController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// User & Admin routes
router.post('/', protect, createReservation);
router.get('/my', protect, getMyReservations);

// Admin-only routes
router.get('/', protect, adminOnly, getAllReservations);
router.put('/:id/status', protect, adminOnly, updateReservationStatus);

// User-specific cancellation
router.put('/:id/cancel', protect, cancelReservation);

export default router;
