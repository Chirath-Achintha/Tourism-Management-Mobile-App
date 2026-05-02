import express from "express";

import {
  createReview,
  getAllReviews,
  getReviewsByDestination,
  getReviewsByHotel,
  updateReview,
  deleteReview,
} from "../controller/reviewController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createReview);
router.get("/", getAllReviews);
router.get("/hotel/:hotelId", getReviewsByHotel);
router.get("/destination/:destinationId", getReviewsByDestination);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);


export default router;