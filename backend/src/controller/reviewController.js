import Review from "../models/Review.js";

// Create Review
export const createReview = async (req, res) => {
  console.log("POST /api/reviews - Payload:", JSON.stringify(req.body, null, 2));
  try {

    const { destinationId, hotelId, rating, comment, image } = req.body;
    const userId = req.user._id;

    // Validation: Enforces a valid target (ID), and a rating (1-5)
    if (!destinationId && !hotelId) {
      return res.status(400).json({ message: "A destination or hotel ID is required" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }


    // Security: Prevents duplicate reviews. A user can only submit one review per entity.
    const query = { userId };
    if (destinationId) query.destinationId = destinationId;
    if (hotelId) query.hotelId = hotelId;

    const existingReview = await Review.findOne(query);
    if (existingReview) {
      return res.status(409).json({
        message: "You have already submitted a review for this item.",
      });
    }

    const review = new Review({
      userId,
      destinationId,
      hotelId,
      rating,
      comment,
      image,
    });

    await review.save();

    res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating review",
      error: error.message,
    });
    console.error("CREATE_REVIEW_ERROR:", error);
  }
};


// Get All Reviews
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "fullName profileImage")
      .populate("hotelId", "name")
      .populate("destinationId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching reviews",
      error: error.message,
    });
  }
};


// Get Reviews by Hotel
export const getReviewsByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Populates user details (Name, Image) automatically when fetching reviews
    const reviews = await Review.find({ hotelId })
      .populate("userId", "fullName email phoneNumber role profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching hotel reviews",
      error: error.message,
    });
  }
};

// Get Reviews by Destination
export const getReviewsByDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;

    // Populates user details (Name, Image) automatically when fetching reviews
    const reviews = await Review.find({ destinationId })
      .populate("userId", "fullName email phoneNumber role profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching destination reviews",
      error: error.message,
    });
  }
};

// Update Review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, image } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Ownership check: Tourist can update their own review only
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own reviews" });
    }

    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (image !== undefined) review.image = image;

    const updatedReview = await review.save();


    res.status(200).json({
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating review",
      error: error.message,
    });
  }
};

// Delete Review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Permission check: Owner can delete own review, Admins can delete any review
    const isOwner = review.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You do not have permission to delete this review" });
    }


    await review.deleteOne();


    res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting review",
      error: error.message,
    });
  }
};