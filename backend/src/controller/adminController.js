import User from "../models/User.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    const formattedUsers = users.map((u) => ({
      id: u._id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      phoneNumber: u.phoneNumber,
      isActive: u.isActive !== false, // Default to true if missing
    }));
    res.status(200).json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users.", error: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Administrators cannot be deactivated." });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      message: `User account ${user.isActive ? "activated" : "deactivated"} successfully.`,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user status.", error: error.message });
  }
};
