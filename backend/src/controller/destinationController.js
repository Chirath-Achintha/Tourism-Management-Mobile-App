import cloudinary from "../config/cloudinary.js";
import Destination from "../models/Destination.js";

export const createDestination = async (req, res) => {
  try {
    const { name, location, category, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Image is required." });
    }

    // Upload to Cloudinary
    // multer might provide path or buffer depending on storage
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "destinations",
    });

    const destination = await Destination.create({
      name,
      location,
      category,
      description,
      imageUrl: result.secure_url,
      cloudinaryId: result.public_id,
    });

    res.status(201).json({
      message: "Destination Created Successfully",
      destination,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating destination.", error: error.message });
  }
};

export const getAllDestinations = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const destinations = await Destination.find(filter).sort({ createdAt: -1 });
    res.status(200).json(destinations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching destinations.", error: error.message });
  }
};

export const updateDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, category, description } = req.body;
    let updateData = { name, location, category, description };

    const destination = await Destination.findById(id);
    if (!destination) {
      return res.status(404).json({ message: "Destination not found." });
    }

    if (req.file) {
      // Delete old image
      await cloudinary.uploader.destroy(destination.cloudinaryId);
      
      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "destinations",
      });
      updateData.imageUrl = result.secure_url;
      updateData.cloudinaryId = result.public_id;
    }

    const updatedDestination = await Destination.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      message: "Destination Updated Successfully",
      destination: updatedDestination,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating destination.", error: error.message });
  }
};

export const deleteDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const destination = await Destination.findById(id);

    if (!destination) {
      return res.status(404).json({ message: "Destination not found." });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(destination.cloudinaryId);

    // Delete from DB
    await Destination.findByIdAndDelete(id);

    res.status(200).json({ message: "Destination Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting destination.", error: error.message });
  }
};
