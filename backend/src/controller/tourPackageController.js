import TourPackage from "../models/TourPackage.js";

export const createTourPackage = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      destination,
      duration,
      startDate,
      endDate,
      price,
      maxParticipants,
      coverImageUri,
      timeline,
        published,
        meals,
        accommodation,
        guide,
        transport,
    } = req.body;

    if (!name) return res.status(400).json({ message: 'Package name is required.' });

    const pkg = new TourPackage({
      name,
      description,
      category,
      destination,
      duration: Number(duration) || 0,
      startDate: startDate || '',
      endDate: endDate || '',
      price: Number(price) || 0,
      maxParticipants: Number(maxParticipants) || 0,
      coverImageUri: coverImageUri || '',
      timeline: Array.isArray(timeline) ? timeline : [],
      meals: meals || '',
      accommodation: accommodation || '',
      guide: guide || '',
      transport: transport || '',
      published: published !== undefined ? Boolean(published) : true,
      createdBy: req.user ? req.user._id : undefined,
    });

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
    const pkg = await TourPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
