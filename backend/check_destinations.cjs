const mongoose = require('mongoose');

const mongoURI = "mongodb+srv://sanuvi:kv9ufhjK3iPwmgtz@cluster3.c4rzjvh.mongodb.net/tourism-data?appName=Cluster3";

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
