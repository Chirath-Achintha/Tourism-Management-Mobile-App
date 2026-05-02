import express from "express";
import { upload, uploadDoc } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import Upload from "../models/Upload.js";

const router = express.Router();

const saveUploadRecord = async ({ file, userId, category }) => {
  const url = file.path && file.path.startsWith("http") ? file.path : `/uploads/${file.filename}`;

  return Upload.create({
    uploadedBy: userId || null,
    originalName: file.originalname,
    fileName: file.filename,
    mimeType: file.mimetype,
    url,
    cloudinaryId: file.filename || file.path || "",
    category,
  });
};

// Route for single image upload (main image)
router.post("/single", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadRecord = await saveUploadRecord({
      file: req.file,
      userId: req.user?._id,
      category: "image",
    });

    res.status(200).json({
      message: "Image uploaded successfully",
      filePath: uploadRecord.url,
      upload: uploadRecord,
    });
  } catch (error) {
    console.error("Single upload failed:", error);
    res.status(500).json({ message: "Failed to save uploaded image.", error: error.message });
  }
});

// Route for multiple image upload (gallery)
router.post("/multiple", protect, upload.array("images", 6), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadRecords = await Promise.all(
      req.files.map((file) =>
        saveUploadRecord({
          file,
          userId: req.user?._id,
          category: "image",
        })
      )
    );

    res.status(200).json({
      message: "Images uploaded successfully",
      filePaths: uploadRecords.map((record) => record.url),
      uploads: uploadRecords,
    });
  } catch (error) {
    console.error("Multiple upload failed:", error);
    res.status(500).json({ message: "Failed to save uploaded images.", error: error.message });
  }
});

// Route for reservation document upload (PDF or Image)
router.post("/reservation-doc", protect, uploadDoc.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No document uploaded" });
    }

    const uploadRecord = await saveUploadRecord({
      file: req.file,
      userId: req.user?._id,
      category: "document",
    });

    res.status(200).json({
      message: "Document uploaded successfully",
      filePath: uploadRecord.url,
      upload: uploadRecord,
    });
  } catch (error) {
    console.error("Document upload failed:", error);
    res.status(500).json({ message: "Failed to save uploaded document.", error: error.message });
  }
});
export default router;
