import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hotelName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    description: {
      type: String,
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    roomConfigs: [
      {
        type: { type: String, required: true }, // 'Single', 'Double', 'Deluxe', 'Suite'
        price: { type: Number, required: true },
        discountPrice: { type: Number },
      }
    ],
    facilities: {
      freeWifi: { type: Boolean, default: false },
      swimmingPool: { type: Boolean, default: false },
      airConditioning: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      restaurant: { type: Boolean, default: false },
      gym: { type: Boolean, default: false },
    },
    mainImage: {
      type: String,
      required: true,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    websiteLink: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "declined"],
      default: "pending",
    },
    declineReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Hotel = mongoose.model("Hotel", hotelSchema);

export default Hotel;
