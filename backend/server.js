import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import TourPackage from "./src/models/TourPackage.js";
import dns from "dns";
// ... other imports

// DNS Configuration
dns.setServers(["8.8.8.8", "1.1.1.1"]);


const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));

    // Scheduler: auto-unpublish tour packages 2 days before their startDate
    const scheduleAutoUnpublish = () => {
      const check = async () => {
        try {
          const now = new Date();
          const pkgs = await TourPackage.find({ published: true, startDate: { $ne: '' } });
          let changed = 0;
          for (const p of pkgs) {
            const start = new Date(p.startDate);
            if (isNaN(start)) continue;
            const cutoff = new Date(start.getTime() - 2 * 24 * 60 * 60 * 1000);
            if (now >= cutoff) {
              p.published = false;
              await p.save();
              changed++;
            }
          }
          if (changed > 0) console.log(`Auto-unpublished ${changed} packages (>= 2 days before start).`);
        } catch (err) {
          console.error('Auto-unpublish error:', err);
        }
      };

      // Run immediately, then every hour
      check();
      setInterval(check, 1000 * 60 * 60);
    };

    scheduleAutoUnpublish();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });