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
      websiteLink,
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
      websiteLink,
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
    const hotel = await Hotel.findById(req.params.id).lean();
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    let googleRating = 4.8;
    let googleTotalReviews = 145;

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (apiKey) {
      try {
        const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(hotel.hotelName + ' ' + hotel.location)}&inputtype=textquery&fields=place_id,rating,user_ratings_total&key=${apiKey}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        if (searchData.candidates && searchData.candidates.length > 0) {
          const candidate = searchData.candidates[0];
          if (candidate.rating) {
            googleRating = candidate.rating;
          }
          if (candidate.user_ratings_total) {
            googleTotalReviews = candidate.user_ratings_total;
          }
        }
      } catch (err) {
        console.error("Google Places API error:", err);
      }
    }

    hotel.googleRating = googleRating;
    hotel.googleTotalReviews = googleTotalReviews;

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
