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
