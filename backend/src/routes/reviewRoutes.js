import express from "express";

import {
  createReview,
  getAllReviews,
  getReviewsByDestination,
  updateReview,
  deleteReview,
} from "../controller/reviewController.js";

const router = express.Router();

router.post("/", createReview);
router.get("/", getAllReviews);
router.get("/destination/:destinationId", getReviewsByDestination);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

export default router;