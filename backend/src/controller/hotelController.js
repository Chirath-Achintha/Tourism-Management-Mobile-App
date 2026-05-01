import Hotel from "../models/Hotel.js";

export const addHotel = async (req, res) => {
  try {
    const {
      hotelName,
      location,
      address,
      description,
      contactEmail,
      contactPhone,
      roomConfigs,
      facilities,
      mainImage,
      galleryImages,
      latitude,
      longitude,
    } = req.body;

    // Use the user ID from the auth middleware (assuming it's attached to req.user)
    const managerId = req.user.id;

    const newHotel = new Hotel({
      managerId,
      hotelName,
      location,
      address,
      description,
      contactEmail,
      contactPhone,
      roomConfigs,
      facilities,
      mainImage,
      galleryImages,
      latitude,
      longitude,
    });

    const savedHotel = await newHotel.save();
    res.status(201).json({
      message: "Hotel added successfully",
      hotel: savedHotel,
    });
  } catch (error) {
    console.error("Add hotel error:", error);
    res.status(500).json({ message: "Server error while adding hotel" });
  }
};

export const getMyHotels = async (req, res) => {
  try {
    const managerId = req.user.id;
    const hotels = await Hotel.find({ managerId });
    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching hotels" });
  }
};

export const getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ isVerified: true });
    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching hotels" });
  }
};

export const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    res.status(200).json(hotel);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching hotel" });
  }
};

export const updateHotel = async (req, res) => {
  try {
    const managerId = req.user.id;
    const hotelId = req.params.id;
    
    const hotel = await Hotel.findOne({ _id: hotelId, managerId });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found or unauthorized" });
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(
      hotelId,
      { $set: { ...req.body, isVerified: true } },
      { new: true }
    );
    res.status(200).json({ message: "Hotel updated successfully", hotel: updatedHotel });
  } catch (error) {
    res.status(500).json({ message: "Server error updating hotel" });
  }
};

export const deleteHotel = async (req, res) => {
  try {
    const managerId = req.user.id;
    const hotelId = req.params.id;
    
    const hotel = await Hotel.findOne({ _id: hotelId, managerId });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found or unauthorized" });
    }

    await Hotel.findByIdAndDelete(hotelId);
    res.status(200).json({ message: "Hotel deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting hotel" });
  }
};

export const adminGetAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching hotels" });
  }
};

export const adminDeleteHotel = async (req, res) => {
  try {
    const hotelId = req.params.id;
    await Hotel.findByIdAndDelete(hotelId);
    res.status(200).json({ message: "Hotel deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting hotel" });
  }
};
