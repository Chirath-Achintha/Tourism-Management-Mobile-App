import express from 'express';
import { protect, adminOnly, tourGuideOnly } from '../middleware/authMiddleware.js';
import {
  createGuideReservation,
  getMyGuideReservations,
  getAllGuideReservations,
  updateGuideReservationStatus,
  cancelGuideReservation,
  getMyGuideAssignments,
  guideRespondToBooking,
} from '../controller/guideReservationController.js';

const router = express.Router();

router.route('/')
  .post(protect, createGuideReservation)
  .get(protect, adminOnly, getAllGuideReservations);

router.route('/my')
  .get(protect, getMyGuideReservations);

// For the guide themselves to see bookings assigned to them
router.route('/my-assignments')
  .get(protect, tourGuideOnly, getMyGuideAssignments);

// Guide approves or rejects their own booking
router.route('/:id/respond')
  .put(protect, tourGuideOnly, guideRespondToBooking);

router.route('/:id/status')
  .put(protect, adminOnly, updateGuideReservationStatus);

router.route('/:id/cancel')
  .put(protect, cancelGuideReservation);

export default router;

