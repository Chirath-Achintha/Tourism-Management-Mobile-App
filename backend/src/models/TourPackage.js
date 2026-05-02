import mongoose from "mongoose";

const daySchema = new mongoose.Schema({
  title: { type: String, default: '' },
  notes: { type: String, default: '' },
  hotel: { type: String, default: '' }, // optional hotel id
  hotelName: { type: String, default: '' },
  hotelLocation: { type: String, default: '' },
  places: {
    type: [
      {
        name: { type: String, default: '' },
        notes: { type: String, default: '' },
        location: { type: String, default: '' },
      },
    ],
    default: [],
  },
}, { _id: false });

const tourPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    destination: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    price: { type: Number, default: 0 },
    minParticipants: { type: Number, default: 0 },
    maxParticipants: { type: Number, default: 0 },
    coverImageUri: { type: String, default: '' },
    timeline: { type: [daySchema], default: [] },
    meals: { type: String, default: '' },
    accommodation: { type: String, default: '' },
    guide: { type: String, default: '' },
    transport: { type: String, default: '' },
    includeHotels: { type: Boolean, default: false },
    includeMeals: { type: Boolean, default: false },
    includeTransport: { type: Boolean, default: false },
    includeActivities: { type: Boolean, default: false },
    includeInsurance: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const TourPackage = mongoose.model('TourPackage', tourPackageSchema);

export default TourPackage;
