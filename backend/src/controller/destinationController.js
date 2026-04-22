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
    console.error("Error in createDestination:", error);
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
    console.error("Error in getAllDestinations:", error);
    res.status(500).json({ message: "Error fetching destinations.", error: error.message });
  }
};

export const getDestinationById = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({ message: "Destination not found" });
    }
    res.status(200).json(destination);
  } catch (error) {
    console.error("Error in getDestinationById:", error);
    res.status(500).json({ message: "Error fetching destination.", error: error.message });
  }
};

export const updateDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, category, description } = req.body;
    let { existingImages } = req.body;
    let updateData = { name, location, category, description };
    let finalImages = [];

    const destination = await Destination.findById(id);
    if (!destination) {
      return res.status(404).json({ message: "Destination not found." });
    }

    // Process existing images to keep
    if (existingImages) {
      // existingImages will be a JSON string from FormData
      const keepList = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      
      // Separate images to keep and images to delete
      const imagesToKeep = [];
      const imagesToDelete = [];

      destination.images.forEach(img => {
        if (keepList.includes(img.url)) {
          imagesToKeep.push(img);
        } else {
          imagesToDelete.push(img);
        }
      });

      // Delete removed images from Cloudinary
      if (imagesToDelete.length > 0) {
        const deletePromises = imagesToDelete.map(img => 
          cloudinary.uploader.destroy(img.cloudinaryId)
        );
        await Promise.all(deletePromises);
      }

      finalImages = imagesToKeep;
    } else if (!req.files || req.files.length === 0) {
       // If no existing images provided and no new files, we might be clearing the gallery
       // but typically we want to keep them if not specified. 
       // However, to be safe, if existingImages is missing but we're updating other fields,
       // we should keep the current gallery unless the user explicitly wants to clear it.
       finalImages = destination.images;
    }

    // Process new uploads
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, {
          folder: "destinations",
        })
      );
      const uploadResults = await Promise.all(uploadPromises);
      const newImages = uploadResults.map((result) => ({
        url: result.secure_url,
        cloudinaryId: result.public_id,
      }));
      
      finalImages = [...finalImages, ...newImages];
    }

    updateData.images = finalImages;

    const updatedDestination = await Destination.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      message: "Destination Updated Successfully",
      destination: updatedDestination,
    });
  } catch (error) {
    console.error("Error in updateDestination:", error);
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
    console.error("Error in deleteDestination:", error);
    res.status(500).json({ message: "Error deleting destination.", error: error.message });
  }
};
