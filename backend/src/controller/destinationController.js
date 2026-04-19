import cloudinary from "../config/cloudinary.js";
import Destination from "../models/Destination.js";

export const createDestination = async (req, res) => {
  try {
    const { name, location, category, description } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required." });
    }

    // Upload to Cloudinary
    const uploadPromises = req.files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: "destinations",
      })
    );

    const uploadResults = await Promise.all(uploadPromises);

    const images = uploadResults.map((result) => ({
      url: result.secure_url,
      cloudinaryId: result.public_id,
    }));

    const destination = await Destination.create({
      name,
      location,
      category,
      description,
      images,
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

    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      const deletePromises = destination.images.map((img) =>
        cloudinary.uploader.destroy(img.cloudinaryId)
      );
      await Promise.all(deletePromises);
      
      // Upload new images
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, {
          folder: "destinations",
        })
      );
      const uploadResults = await Promise.all(uploadPromises);
      
      updateData.images = uploadResults.map((result) => ({
        url: result.secure_url,
        cloudinaryId: result.public_id,
      }));
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

    // Delete all images from Cloudinary
    const deletePromises = destination.images.map((img) =>
      cloudinary.uploader.destroy(img.cloudinaryId)
    );
    await Promise.all(deletePromises);

    // Delete from DB
    await Destination.findByIdAndDelete(id);

    res.status(200).json({ message: "Destination Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting destination.", error: error.message });
  }
};
