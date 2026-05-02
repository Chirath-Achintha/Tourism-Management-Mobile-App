import mongoose from "mongoose";
import { connectDB } from "./src/config/db.js";
import Review from "./src/models/Review.js";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

// Fix for MongoDB DNS issues
dns.setServers(["8.8.8.8", "1.1.1.1"]);


const dropIndexes = async () => {
  try {
    await connectDB();
    console.log("Connected to DB...");
    
    // Drop all indexes for the reviews collection
    await Review.collection.dropIndexes();
    console.log("Successfully dropped all indexes for reviews collection.");
    
    process.exit(0);
  } catch (error) {
    console.error("Error dropping indexes:", error);
    process.exit(1);
  }
};

dropIndexes();
