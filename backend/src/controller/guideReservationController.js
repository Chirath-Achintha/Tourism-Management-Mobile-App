import GuideReservation from '../models/GuideReservation.js';
import Guide from '../models/Guide.js';

// @desc    Get bookings received by the logged-in tour guide
// @route   GET /api/guide-reservations/my-assignments
// @access  Private (tour_guide role)
export const getMyGuideAssignments = async (req, res) => {
  try {
    // Find the Guide profile linked to this user account
    const guideProfile = await Guide.findOne({ userId: req.user._id });
    if (!guideProfile) {
      return res.status(404).json({ message: 'No guide profile linked to your account. Please contact admin.' });
    }

    const reservations = await GuideReservation.find({ guideId: guideProfile._id })
      .populate('userId', 'fullName email phoneNumber')
      .sort({ createdAt: -1 });

    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Create a new guide reservation
// @route   POST /api/guide-reservations
// @access  Private
export const createGuideReservation = async (req, res) => {
  try {
    const { guideId, numberOfPeople, specialRequest } = req.body;

    // 1. Basic Validation
    if (!guideId || !numberOfPeople) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (numberOfPeople <= 0) {
      return res.status(400).json({ message: 'Number of people must be at least 1' });
    }

    // 2. Resource Validation
    const guide = await Guide.findById(guideId);
    if (!guide) {
      return res.status(404).json({ message: 'Tour guide not found' });
    }

    const reservation = new GuideReservation({
      userId: req.user._id,
      guideId,
      numberOfPeople,
      specialRequest,
      status: 'Pending',
    });

    const createdReservation = await reservation.save();
    res.status(201).json(createdReservation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get logged in user's guide reservations
// @route   GET /api/guide-reservations/my
// @access  Private
export const getMyGuideReservations = async (req, res) => {
  try {
    const reservations = await GuideReservation.find({ userId: req.user._id })
      .populate('guideId', 'name imageUrl contact language')
      .sort({ createdAt: -1 });
    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get all guide reservations (Admin only)
// @route   GET /api/guide-reservations
// @access  Private/Admin
export const getAllGuideReservations = async (req, res) => {
  try {
    const reservations = await GuideReservation.find({})
      .populate('userId', 'fullName email')
      .populate('guideId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Update reservation status (Admin only)
// @route   PUT /api/guide-reservations/:id/status
// @access  Private/Admin
export const updateGuideReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const reservation = await GuideReservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    reservation.status = status;
    const updatedReservation = await reservation.save();
    res.status(200).json(updatedReservation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Cancel reservation (User only)
// @route   PUT /api/guide-reservations/:id/cancel
// @access  Private
export const cancelGuideReservation = async (req, res) => {
  try {
    const reservation = await GuideReservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Security check
    if (reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: This is not your reservation' });
    }

    // Business rule
    if (reservation.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending reservations can be cancelled' });
    }

    reservation.status = 'Cancelled';
    const updatedReservation = await reservation.save();
    res.status(200).json(updatedReservation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Guide approves or rejects a booking for themselves
// @route   PUT /api/guide-reservations/:id/respond
// @access  Private (tour_guide only)
export const guideRespondToBooking = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }

    // Find the guide profile linked to the logged-in user
    const guideProfile = await Guide.findOne({ userId: req.user._id });
    if (!guideProfile) {
      return res.status(404).json({ message: 'No guide profile linked to your account' });
    }

    // Find the reservation
    const reservation = await GuideReservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Security: make sure this booking is FOR this guide
    if (reservation.guideId.toString() !== guideProfile._id.toString()) {
      return res.status(403).json({ message: 'Access denied: This booking is not for you' });
    }

    // Only pending bookings can be responded to
    if (reservation.status !== 'Pending') {
      return res.status(400).json({ message: `This booking is already ${reservation.status}` });
    }

    reservation.status = status;
    const updatedReservation = await reservation.save();
    res.status(200).json(updatedReservation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};
