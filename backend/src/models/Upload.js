import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    cloudinaryId: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["image", "document"],
      default: "image",
    },
  },
  {
    timestamps: true,
  }
);

const Upload = mongoose.model("Upload", uploadSchema);

export default Upload;