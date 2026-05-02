import mongoose from "mongoose";
const MONGO_URI = "mongodb+srv://medhavi:EF8ciehEVbWLIzew@cluster3.c4rzjvh.mongodb.net/tourism-data?retryWrites=true&w=majority";

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
