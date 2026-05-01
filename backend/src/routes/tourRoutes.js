import express from 'express';
import { getPublishedPackages } from '../controller/tourPackageController.js';

const router = express.Router();

// Public route for users to browse published tour packages
router.get('/', getPublishedPackages);

export default router;
