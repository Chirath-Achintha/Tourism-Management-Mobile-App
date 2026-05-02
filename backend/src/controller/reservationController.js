import Reservation from '../models/Reservation.js';
import TourPackage from '../models/TourPackage.js';

// @desc    Create a new reservation
// @route   POST /api/reservations
// @access  Private
export const createReservation = async (req, res) => {
  try {
    const { packageId, travelDate, numberOfPeople, specialRequest, documentType } = req.body;
    const documentPath = req.file ? `/uploads/${req.file.filename}` : '';

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
      documentType: documentType || 'NIC',
      documentPath,
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

// @desc    Get reservation by ID
// @route   GET /api/reservations/:id
// @access  Private
export const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('packageId', 'name price');
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    // Security: Only owner or admin
    if (reservation.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update reservation (User only)
// @route   PUT /api/reservations/:id
// @access  Private
export const updateReservation = async (req, res) => {
  try {
    const { travelDate, numberOfPeople, specialRequest, documentType } = req.body;
    
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Security check: Only the owner can edit their reservation
    if (reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this reservation' });
    }

    // Business rule: Only Pending reservations can be edited
    if (reservation.status !== 'Pending') {
      return res.status(400).json({ 
        message: `This reservation is ${reservation.status} and locked for editing. Only pending reservations can be modified.` 
      });
    }

    // Update basic fields
    if (travelDate) reservation.travelDate = travelDate;
    if (specialRequest !== undefined) reservation.specialRequest = specialRequest;
    if (documentType) reservation.documentType = documentType;

    // Handle document replacement (Reuse existing upload middleware)
    if (req.file) {
      reservation.documentPath = `/uploads/${req.file.filename}`;
    }

    // Handle number of people and price recalculation
    if (numberOfPeople) {
      const tourPackage = await TourPackage.findById(reservation.packageId);
      if (!tourPackage) {
        return res.status(404).json({ message: 'Linked tour package not found' });
      }
      reservation.numberOfPeople = numberOfPeople;
      reservation.totalPrice = tourPackage.price * numberOfPeople;
    }

    const updatedReservation = await reservation.save();
    res.json(updatedReservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
