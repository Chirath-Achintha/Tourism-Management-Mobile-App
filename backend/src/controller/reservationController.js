import Reservation from '../models/Reservation.js';
import TourPackage from '../models/TourPackage.js';

// @desc    Create a new reservation
// @route   POST /api/reservations
// @access  Private
export const createReservation = async (req, res) => {
  try {
    const { packageId, travelDate, numberOfPeople, specialRequest } = req.body;

    // Fetch the package to get current price for calculation
    const tourPackage = await TourPackage.findById(packageId);
    if (!tourPackage) {
      return res.status(404).json({ message: 'Tour package not found' });
    }

    // Automatically calculate total price based on number of people
    const totalPrice = tourPackage.price * numberOfPeople;

    const reservation = new Reservation({
      userId: req.user._id,
      packageId,
      travelDate,
      numberOfPeople,
      totalPrice,
      specialRequest,
      status: 'Pending', // Enforce Pending status on creation
    });

    const createdReservation = await reservation.save();
    res.status(201).json(createdReservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's reservations
// @route   GET /api/reservations/my-bookings
// @access  Private
export const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user._id })
      .populate('packageId', 'name destination coverImageUri')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reservations (Admin only)
// @route   GET /api/reservations
// @access  Private/Admin
export const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({})
      .populate('userId', 'fullName email')
      .populate('packageId', 'name destination')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update reservation status (Admin only)
// @route   PATCH /api/reservations/:id/status
// @access  Private/Admin
export const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Admin can update to Approved or Rejected
    reservation.status = status;
    const updatedReservation = await reservation.save();
    res.json(updatedReservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel reservation (User only)
// @route   PATCH /api/reservations/:id/cancel
// @access  Private
export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Security check: Only the owner can cancel their reservation
    if (reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to cancel this reservation' });
    }

    // Only allow canceling if the reservation is still Pending
    if (reservation.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending reservations can be cancelled' });
    }

    reservation.status = 'Cancelled';
    const updatedReservation = await reservation.save();
    res.json(updatedReservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
