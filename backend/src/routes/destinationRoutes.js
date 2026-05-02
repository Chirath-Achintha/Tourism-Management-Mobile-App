import express from "express";
import multer from "multer";
import os from "os";
import {
  createDestination,
  getAllDestinations,
  updateDestination,
  deleteDestination,
  getDestinationById,
} from "../controller/destinationController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer storage configuration (temporary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Please upload an image."), false);
    }
  },
});

router.get("/", getAllDestinations);
router.get("/:id", getDestinationById);
router.post("/", protect, adminOnly, upload.array("images", 5), createDestination);
router.put("/:id", protect, adminOnly, upload.array("images", 5), updateDestination);
router.delete("/:id", protect, adminOnly, deleteDestination);

export default router;
