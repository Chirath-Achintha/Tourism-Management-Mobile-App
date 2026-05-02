import express from 'express';
<<<<<<< HEAD
import { getPublishedPackages, getTourPackageById } from '../controller/tourPackageController.js';

const router = express.Router();

// Public routes for users to browse published tour packages
router.get('/', getPublishedPackages);
router.get('/:id', getTourPackageById);
=======
import { getPublishedPackages } from '../controller/tourPackageController.js';

const router = express.Router();

// Public route for users to browse published tour packages
router.get('/', getPublishedPackages);
>>>>>>> Destination-Management

export default router;
