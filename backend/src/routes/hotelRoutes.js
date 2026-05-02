import express from "express";
<<<<<<< HEAD
import { addHotel, getMyHotels, getAllHotels, updateHotel, getHotelById, deleteHotel } from "../controller/hotelController.js";
=======
import { addHotel, getMyHotels, getAllHotels } from "../controller/hotelController.js";
>>>>>>> Destination-Management
import { protect, hotelManagerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, hotelManagerOnly, addHotel);
router.get("/my-hotels", protect, hotelManagerOnly, getMyHotels);
router.get("/all", getAllHotels);
<<<<<<< HEAD
router.get("/:id", getHotelById);
router.put("/:id", protect, hotelManagerOnly, updateHotel);
router.delete("/:id", protect, hotelManagerOnly, deleteHotel);
=======
>>>>>>> Destination-Management

export default router;
