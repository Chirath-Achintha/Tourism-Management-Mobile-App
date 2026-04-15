import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9]{7,15}$/;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getJwtSecret = () => process.env.JWT_SECRET || "development_secret_change_me";

const createAuthResponse = (user) => {
  const token = jwt.sign({ userId: user._id, email: user.email }, getJwtSecret(), {
    expiresIn: "7d",
  });

  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    },
  };
};

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword, role } = req.body;

    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (!phonePattern.test(phoneNumber)) {
      return res.status(400).json({
        message: "Please provide a valid phone number with 7 to 15 digits.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "An account already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
      role: role || "tourist",
    });

    return res.status(201).json({
      message: "Registration successful.",
      ...createAuthResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const rawIdentifier = (email || username || "").trim();
    const normalizedIdentifier = rawIdentifier.toLowerCase();

    if (!rawIdentifier || !password) {
      return res.status(400).json({ message: "Email, username, or phone number and password are required." });
    }

    const loginFilters = [{ email: normalizedIdentifier }, { username: normalizedIdentifier }];

    if (phonePattern.test(rawIdentifier)) {
      loginFilters.push({ phoneNumber: rawIdentifier });
    } else {
      loginFilters.push({ fullName: new RegExp(`^${escapeRegex(rawIdentifier)}$`, "i") });
    }

    const user = await User.findOne({ $or: loginFilters });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    let isPasswordMatch = false;

    // Accept legacy plaintext passwords for old records and migrate them to bcrypt on successful login.
    if (typeof user.password === "string" && user.password.startsWith("$2")) {
      isPasswordMatch = await bcrypt.compare(password, user.password);
    } else {
      isPasswordMatch = password === user.password;
      if (isPasswordMatch) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    return res.status(200).json({
      message: "Login successful.",
      ...createAuthResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phoneNumber } = req.body;

    const normalizedName = typeof fullName === "string" ? fullName.trim() : "";
    const normalizedPhone = typeof phoneNumber === "string" ? phoneNumber.trim() : "";

    if (!normalizedName || !normalizedPhone) {
      return res.status(400).json({ message: "Full name and phone number are required." });
    }

    if (!phonePattern.test(normalizedPhone)) {
      return res.status(400).json({
        message: "Please provide a valid phone number with 7 to 15 digits.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        fullName: normalizedName,
        phoneNumber: normalizedPhone,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile.", error: error.message });
  }
};
