import express from 'express';
import { getPublishedPackages, getTourPackageById } from '../controller/tourPackageController.js';

const router = express.Router();

// Public routes for users to browse published tour packages
router.get('/', getPublishedPackages);
router.get('/:id', getTourPackageById);

export default router;
