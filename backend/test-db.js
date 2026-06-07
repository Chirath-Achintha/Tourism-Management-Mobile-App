import "dotenv/config";
import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://uvindu:dDa9swyxl9VHzSg4@cluster3.c4rzjvh.mongodb.net/tourism-data?retryWrites=true&w=majority";

console.log("Attempting to connect to:", MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("SUCCESS: Connected to MongoDB!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("FAILURE:", err);
    process.exit(1);
  });
