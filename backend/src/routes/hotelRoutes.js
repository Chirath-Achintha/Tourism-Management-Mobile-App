import express from "express";
import { addHotel, getMyHotels, getAllHotels } from "../controller/hotelController.js";
import { protect, hotelManagerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, hotelManagerOnly, addHotel);
router.get("/my-hotels", protect, hotelManagerOnly, getMyHotels);
router.get("/all", getAllHotels);

export default router;
