import express from "express";
import { addHotel, getMyHotels, getAllHotels, updateHotel, getHotelById, deleteHotel } from "../controller/hotelController.js";
import { protect, hotelManagerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, hotelManagerOnly, addHotel);
router.get("/my-hotels", protect, hotelManagerOnly, getMyHotels);
router.get("/all", getAllHotels);
router.get("/:id", getHotelById);
router.put("/:id", protect, hotelManagerOnly, updateHotel);
router.delete("/:id", protect, hotelManagerOnly, deleteHotel);

export default router;
