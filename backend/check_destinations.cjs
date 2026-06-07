require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Fix for MongoDB DNS issues
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoURI = process.env.MONGO_URI || "mongodb+srv://uvindu:dDa9swyxl9VHzSg4@cluster3.c4rzjvh.mongodb.net/tourism-data?retryWrites=true&w=majority";

async function checkDestinations() {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const destinations = await db.collection('destinations').find({}).toArray();
    console.log("Destinations found:", destinations.length);
    destinations.forEach(d => {
      console.log(`- ${d.name}: ID=${d._id} (Type: ${typeof d._id})`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

checkDestinations();
