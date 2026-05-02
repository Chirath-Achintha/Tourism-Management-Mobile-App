import express from "express";
<<<<<<< HEAD
import { upload, uploadDoc } from "../middleware/uploadMiddleware.js";
=======
import { upload } from "../middleware/uploadMiddleware.js";
>>>>>>> Destination-Management
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route for single image upload (main image)
router.post("/single", protect, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.status(200).json({ filePath });
});

// Route for multiple image upload (gallery)
router.post("/multiple", protect, upload.array("images", 6), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }
  const filePaths = req.files.map((file) => `/uploads/${file.filename}`);
  res.status(200).json({ filePaths });
});

<<<<<<< HEAD
// Route for reservation document upload (PDF or Image)
router.post("/reservation-doc", protect, uploadDoc.single("document"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No document uploaded" });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.status(200).json({ filePath });
});

=======
>>>>>>> Destination-Management
export default router;
