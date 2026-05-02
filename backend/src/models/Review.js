import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The review can target either a hotel or a destination
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: false,
    },
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: false,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false, // Optional as per documentation
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate reviews by the same user for the same target
// This is a secondary layer of security mentioned in the documentation
// Partial indexes to allow a user to have one review per hotel and one review per destination independently.
// We use partialFilterExpression to only apply the uniqueness within the specific target type.
reviewSchema.index(
  { userId: 1, hotelId: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { hotelId: { $exists: true, $ne: null } } 
  }
);

reviewSchema.index(
  { userId: 1, destinationId: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { destinationId: { $exists: true, $ne: null } } 
  }
);


export default mongoose.model("Review", reviewSchema);