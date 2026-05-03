import express from "express";
import {
  getAllGuides,
  getGuideById,
  createGuide,
  updateGuide,
  deleteGuide,
} from "../controller/guideController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.route("/")
  .get(protect, getAllGuides)
  .post(protect, adminOnly, upload.single("image"), createGuide);

router.route("/:id")
  .get(protect, getGuideById)
  .put(protect, adminOnly, upload.single("image"), updateGuide)
  .delete(protect, adminOnly, deleteGuide);

export default router;
