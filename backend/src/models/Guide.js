import mongoose from "mongoose";

const guideSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Guide", guideSchema);
