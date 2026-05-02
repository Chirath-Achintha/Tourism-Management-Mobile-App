import Reservation from '../models/Reservation.js';
import TourPackage from '../models/TourPackage.js';

// @desc    Create a new reservation
// @route   POST /api/reservations
// @access  Private
export const createReservation = async (req, res) => {
  try {
    const { packageId, travelDate, numberOfPeople, specialRequest, documentType } = req.body;
    const documentPath = req.file ? `/uploads/${req.file.filename}` : '';

    // 1. Basic Validation
    if (!packageId || !travelDate || !numberOfPeople) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (numberOfPeople <= 0) {
      return res.status(400).json({ message: 'Number of people must be at least 1' });
    }

    if (new Date(travelDate) < new Date().setHours(0,0,0,0)) {
      return res.status(400).json({ message: 'Travel date cannot be in the past' });
    }

    if (!documentPath) {
      return res.status(400).json({ message: 'Please upload an identification document' });
    }

    // 2. Resource Validation
    const tourPackage = await TourPackage.findById(packageId);
    if (!tourPackage) {
      return res.status(404).json({ message: 'Tour package not found' });
    }

    // 3. Price Calculation
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
      status: 'Pending',
    });

    const createdReservation = await reservation.save();
    res.status(201).json(createdReservation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get logged in user's reservations
// @route   GET /api/reservations/my
// @access  Private
export const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user._id })
      .populate('packageId', 'name destination coverImageUri')
      .sort({ createdAt: -1 });
    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
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
    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Update reservation status (Admin only)
// @route   PUT /api/reservations/:id/status
// @access  Private/Admin
export const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const reservation = await Reservation.findById(req.params.id);
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
// @route   PUT /api/reservations/:id/cancel
// @access  Private
export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

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

// @desc    Get reservation stats for dashboard
// @route   GET /api/reservations/stats
// @access  Private
export const getReservationStats = async (req, res) => {
  try {
    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
    };

    if (req.user.role === 'admin') {
      stats.total = await Reservation.countDocuments();
      stats.pending = await Reservation.countDocuments({ status: 'Pending' });
      stats.approved = await Reservation.countDocuments({ status: 'Approved' });
    } else {
      stats.total = await Reservation.countDocuments({ userId: req.user._id });
      stats.pending = await Reservation.countDocuments({ userId: req.user._id, status: 'Pending' });
      stats.approved = await Reservation.countDocuments({ userId: req.user._id, status: 'Approved' });
    }

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
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
      return res.status(403).json({ message: 'Access denied: Unauthorized access' });
    }

    res.status(200).json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
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

    // 1. Security Check
    if (reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: This is not your reservation' });
    }

    // 2. Business Rule: Only Pending editable
    if (reservation.status !== 'Pending') {
      return res.status(400).json({ 
        message: `This reservation is already ${reservation.status} and locked for editing.` 
      });
    }

    // 3. Date Validation
    if (travelDate && new Date(travelDate) < new Date().setHours(0,0,0,0)) {
      return res.status(400).json({ message: 'New travel date cannot be in the past' });
    }

    // 4. Update basic fields
    if (travelDate) reservation.travelDate = travelDate;
    if (specialRequest !== undefined) reservation.specialRequest = specialRequest;
    if (documentType) reservation.documentType = documentType;

    if (req.file) {
      reservation.documentPath = `/uploads/${req.file.filename}`;
    }

    // 5. Number of people and price recalculation
    if (numberOfPeople) {
      if (numberOfPeople <= 0) {
        return res.status(400).json({ message: 'Number of people must be at least 1' });
      }
      
      const tourPackage = await TourPackage.findById(reservation.packageId);
      if (!tourPackage) {
        return res.status(404).json({ message: 'Linked tour package not found' });
      }
      reservation.numberOfPeople = numberOfPeople;
      reservation.totalPrice = tourPackage.price * numberOfPeople;
    }

    const updatedReservation = await reservation.save();
    res.status(200).json(updatedReservation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};
