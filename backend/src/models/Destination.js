import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    categories: [{
      type: String,
      required: true,
      enum: ["Beach", "Mountain", "City", "Cultural", "Nature", "Landmark", "Adventure", "Wildlife", "Religious", "Historical"],
      trim: true,
    }],
    description: {
      type: String,
      required: true,
    },
    averageTemp: {
      type: String,
      default: "25°C",
    },
    bestTimeToVisit: {
      type: String,
      default: "Year-round",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    images: [
      {
        url: { type: String, required: true },
        cloudinaryId: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Destination = mongoose.model("Destination", destinationSchema);

export default Destination;
