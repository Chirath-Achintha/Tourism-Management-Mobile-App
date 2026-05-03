import Guide from "../models/Guide.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

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

// @desc    Create a tour guide (also creates a linked login account)
// @route   POST /api/guides
// @access  Private/Admin
export const createGuide = async (req, res) => {
  try {
    const { name, experience, language, contact, email, password } = req.body;

    // 1. Validate required fields
    if (!name || !experience || !language || !contact || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields including email and password" });
    }

    if (!phonePattern.test(contact)) {
      return res.status(400).json({ message: "Please provide a valid 10-digit phone number" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // 2. Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    // 3. Get image URL
    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.path;
    } else {
      return res.status(400).json({ message: "Please upload an image for the guide" });
    }

    // 4. Create the User account
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: name,
      email: email.toLowerCase(),
      phoneNumber: contact,
      password: hashedPassword,
      role: "tour_guide",
    });

    // 5. Create the Guide profile linked to the user
    const guide = await Guide.create({
      name,
      experience,
      language,
      contact,
      imageUrl,
      userId: user._id,
    });

    res.status(201).json({
      message: `Tour guide created successfully. Login email: ${email}`,
      guide,
    });
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

// @desc    Delete a tour guide (also deletes the linked user account)
// @route   DELETE /api/guides/:id
// @access  Private/Admin
export const deleteGuide = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);

    if (!guide) {
      return res.status(404).json({ message: "Tour guide not found" });
    }

    // Also delete the linked user account if exists
    if (guide.userId) {
      await User.findByIdAndDelete(guide.userId);
    }

    await guide.deleteOne();
    res.status(200).json({ message: "Tour guide and linked account removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete tour guide", error: error.message });
  }
};
