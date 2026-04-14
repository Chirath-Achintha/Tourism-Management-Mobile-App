import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9]{7,15}$/;

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.status(200).json({
      message: "Login successful.",
      ...createAuthResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};
