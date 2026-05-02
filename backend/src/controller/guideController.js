import Guide from "../models/Guide.js";

// @desc    Get all tour guides
// @route   GET /api/guides
// @access  Private (Tourists and Admins)
export const getAllGuides = async (req, res) => {
  try {
    const guides = await Guide.find().sort({ createdAt: -1 });
    res.status(200).json(guides);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tour guides", error: error.message });
  }
};

// @desc    Get single tour guide
// @route   GET /api/guides/:id
// @access  Private (Tourists and Admins)
export const getGuideById = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) {
      return res.status(404).json({ message: "Tour guide not found" });
    }
    res.status(200).json(guide);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tour guide", error: error.message });
  }
};

const phonePattern = /^[0-9]{10}$/;

// @desc    Create a tour guide
// @route   POST /api/guides
// @access  Private/Admin
export const createGuide = async (req, res) => {
  try {
    const { name, experience, language, contact } = req.body;

    if (!name || !experience || !language || !contact) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    if (!phonePattern.test(contact)) {
      return res.status(400).json({ message: "Please provide a valid 10-digit phone number" });
    }

    let imageUrl = "";
    if (req.file) {
      // Cloudinary storage returns the URL in req.file.path
      imageUrl = req.file.path;
    } else {
      return res.status(400).json({ message: "Please upload an image for the guide" });
    }

    const guide = await Guide.create({
      name,
      experience,
      language,
      contact,
      imageUrl,
    });

    res.status(201).json({ message: "Tour guide created successfully", guide });
  } catch (error) {
    res.status(500).json({ message: "Failed to create tour guide", error: error.message });
  }
};

// @desc    Update a tour guide
// @route   PUT /api/guides/:id
// @access  Private/Admin
export const updateGuide = async (req, res) => {
  try {
    const { name, experience, language, contact } = req.body;
    let guide = await Guide.findById(req.params.id);

    if (!guide) {
      return res.status(404).json({ message: "Tour guide not found" });
    }

    let imageUrl = guide.imageUrl;
    if (req.file) {
      imageUrl = req.file.path;
    } else if (req.body.existingImage) {
      imageUrl = req.body.existingImage;
    }

    guide.name = name || guide.name;
    guide.experience = experience || guide.experience;
    guide.language = language || guide.language;
    
    if (contact) {
      if (!phonePattern.test(contact)) {
        return res.status(400).json({ message: "Please provide a valid 10-digit phone number" });
      }
      guide.contact = contact;
    }
    
    guide.imageUrl = imageUrl;

    const updatedGuide = await guide.save();
    res.status(200).json({ message: "Tour guide updated successfully", guide: updatedGuide });
  } catch (error) {
    res.status(500).json({ message: "Failed to update tour guide", error: error.message });
  }
};

// @desc    Delete a tour guide
// @route   DELETE /api/guides/:id
// @access  Private/Admin
export const deleteGuide = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);

    if (!guide) {
      return res.status(404).json({ message: "Tour guide not found" });
    }

    await guide.deleteOne();
    res.status(200).json({ message: "Tour guide removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete tour guide", error: error.message });
  }
};
