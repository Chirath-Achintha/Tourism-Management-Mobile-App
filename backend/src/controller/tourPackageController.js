import TourPackage from "../models/TourPackage.js";
import Destination from "../models/Destination.js";
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const createTourPackage = async (req, res) => {
  try {
    // Accept multipart/form-data with optional 'cover' file
    const {
      name,
      description,
      category,
      location,
      duration,
      startDate,
      endDate,
      price,
      minParticipants,
      maxParticipants,
      // coverImageUri may be provided as a fallback string
      coverImageUri,
      timeline,
        published,
        meals,
        accommodation,
        guide,
        transport,
        included,
    } = req.body;

    if (!name) return res.status(400).json({ message: 'Package name is required.' });

    let resolvedDestination = location || '';
    let resolvedDestinationId = null;

    // Parse timeline to extract places
    let timelineData = [];
    if (typeof timeline === 'string') {
      try {
        timelineData = JSON.parse(timeline);
      } catch {
        timelineData = [];
      }
    } else if (Array.isArray(timeline)) {
      timelineData = timeline;
    }

    // Auto-detect destination by checking places in the itinerary
    if (Array.isArray(timelineData) && timelineData.length > 0) {
      for (const day of timelineData) {
        if (day.places && Array.isArray(day.places)) {
          for (const place of day.places) {
            if (place.name && place.name.trim()) {
              const matchingDestination = await Destination.findOne({
                $or: [
                  { name: { $regex: `^${place.name.trim()}$`, $options: 'i' } },
                  { location: { $regex: `^${place.name.trim()}$`, $options: 'i' } }
                ]
              });
              
              if (matchingDestination) {
                resolvedDestination = matchingDestination.name;
                resolvedDestinationId = matchingDestination._id;
                break; // Found a match, stop searching
              }
            }
          }
          if (resolvedDestinationId) break; // If found, exit outer loop too
        }
      }
    }

    // Parse included array if it's a string
    let includedArray = [];
    if (typeof included === 'string') {
      try {
        includedArray = JSON.parse(included);
      } catch {
        includedArray = [];
      }
    } else if (Array.isArray(included)) {
      includedArray = included;
    }

    const pkg = new TourPackage({
      name,
      description,
      category,
      destinationId: resolvedDestinationId,
      destination: resolvedDestination,
      duration: Number(duration) || 0,
      startDate: startDate || '',
      endDate: endDate || '',
      price: Number(price) || 0,
      minParticipants: Number(minParticipants) || 0,
      maxParticipants: Number(maxParticipants) || 0,
      coverImageUri: coverImageUri || '',
      timeline: timelineData,
      meals: meals || '',
      accommodation: accommodation || '',
      guide: guide || '',
      transport: transport || '',
      includeHotels: includedArray.includes('hotels'),
      includeMeals: includedArray.includes('meals'),
      includeTransport: includedArray.includes('transport'),
      includeActivities: includedArray.includes('activities'),
      includeInsurance: includedArray.includes('insurance'),
      published: published !== undefined ? Boolean(published) : true,
      createdBy: req.user ? req.user._id : undefined,
    });

    // If a file was uploaded under the field 'cover', upload it to Cloudinary
    if (req.file && req.file.buffer) {
      try {
        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const uploadRes = await cloudinary.v2.uploader.upload(dataUri, { folder: 'tour-packages' });
        if (uploadRes && uploadRes.secure_url) {
          pkg.coverImageUri = uploadRes.secure_url;
        }
      } catch (uploadErr) {
        console.error('Cloudinary upload failed:', uploadErr.message || uploadErr);
      }
    }

    await pkg.save();

    res.status(201).json({ message: 'Tour package created', package: pkg });
  } catch (error) {
    console.error('Create TourPackage error:', error.message);
    res.status(500).json({ message: 'Failed to create package', error: error.message });
  }
};

export const getPublishedPackages = async (req, res) => {
  try {
    const packages = await TourPackage.find({ published: true }).sort({ createdAt: -1 });
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch packages', error: error.message });
  }
};

export const getAllTourPackages = async (req, res) => {
  try {
    console.log('GET /admin/tour-packages called');
    const packages = await TourPackage.find().sort({ createdAt: -1 });
    console.log('Found packages:', packages.length);
    res.status(200).json(packages);
  } catch (error) {
    console.error('getAllTourPackages error:', error);
    res.status(500).json({ message: 'Failed to fetch tour packages', error: error.message });
  }
};

export const getTourPackageById = async (req, res) => {
  try {
    const pkg = await TourPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Tour package not found' });
    res.status(200).json(pkg);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch package', error: error.message });
  }
};

export const updateTourPackage = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Parse timeline first
    let timelineData = [];
    if (updateData.timeline) {
      if (typeof updateData.timeline === 'string') {
        try {
          timelineData = JSON.parse(updateData.timeline);
        } catch {
          timelineData = [];
        }
      } else if (Array.isArray(updateData.timeline)) {
        timelineData = updateData.timeline;
      }
      updateData.timeline = timelineData;
    }
    
    // Auto-detect destination by checking places in the itinerary
    if (Array.isArray(timelineData) && timelineData.length > 0) {
      for (const day of timelineData) {
        if (day.places && Array.isArray(day.places)) {
          for (const place of day.places) {
            if (place.name && place.name.trim()) {
              const matchingDestination = await Destination.findOne({
                $or: [
                  { name: { $regex: `^${place.name.trim()}$`, $options: 'i' } },
                  { location: { $regex: `^${place.name.trim()}$`, $options: 'i' } }
                ]
              });
              
              if (matchingDestination) {
                updateData.destination = matchingDestination.name;
                updateData.destinationId = matchingDestination._id;
                break;
              }
            }
          }
          if (updateData.destinationId) break;
        }
      }
    }
    
    // Parse included array if present
    if (updateData.included) {
      let includedArray = [];
      if (typeof updateData.included === 'string') {
        try {
          includedArray = JSON.parse(updateData.included);
        } catch {
          includedArray = [];
        }
      } else if (Array.isArray(updateData.included)) {
        includedArray = updateData.included;
      }
      updateData.includeHotels = includedArray.includes('hotels');
      updateData.includeMeals = includedArray.includes('meals');
      updateData.includeTransport = includedArray.includes('transport');
      updateData.includeActivities = includedArray.includes('activities');
      updateData.includeInsurance = includedArray.includes('insurance');
      delete updateData.included; // Remove the array from updateData
    }

    // If a new cover file was uploaded, upload to Cloudinary and set coverImageUri
    if (req.file && req.file.buffer) {
      try {
        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const uploadRes = await cloudinary.v2.uploader.upload(dataUri, { folder: 'tour-packages' });
        if (uploadRes && uploadRes.secure_url) {
          updateData.coverImageUri = uploadRes.secure_url;
        }
      } catch (uploadErr) {
        console.error('Cloudinary upload failed on update:', uploadErr.message || uploadErr);
      }
    }

    const pkg = await TourPackage.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!pkg) return res.status(404).json({ message: 'Tour package not found' });
    res.status(200).json({ message: 'Tour package updated', package: pkg });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update package', error: error.message });
  }
};

export const deleteTourPackage = async (req, res) => {
  try {
    console.log('DELETE /admin/tour-packages/:id called with ID:', req.params.id);
    const pkg = await TourPackage.findByIdAndDelete(req.params.id);
    if (!pkg) {
      console.log('Package not found:', req.params.id);
      return res.status(404).json({ message: 'Tour package not found' });
    }
    console.log('Package deleted:', req.params.id);
    res.status(200).json({ message: 'Tour package deleted' });
  } catch (error) {
    console.error('deleteTourPackage error:', error);
    res.status(500).json({ message: 'Failed to delete package', error: error.message });
  }
};
