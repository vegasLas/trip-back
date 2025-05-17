import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { BadRequestError } from '../utils/errors';

// Create upload directories if they don't exist
const createDirIfNotExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Set up directories
const uploadsBaseDir = process.env.UPLOAD_DIR || '/app/uploads';
const guideImagesDir = path.join(uploadsBaseDir, 'guides');
const programImagesDir = path.join(uploadsBaseDir, 'programs');

// Create directories
createDirIfNotExists(guideImagesDir);
createDirIfNotExists(programImagesDir);

// Storage configuration for guide images
const guideImageStorage = multer.diskStorage({
  destination (_, __, cb) {
    cb(null, guideImagesDir);
  },
  filename (_, file, cb) {
    // Generate a unique filename with timestamp
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + path.extname(file.originalname));
  }
});

// Storage configuration for program images
const programImageStorage = multer.diskStorage({
  destination (_, __, cb) {
    cb(null, programImagesDir);
  },
  filename (_, file, cb) {
    // Generate a unique filename with timestamp
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (_: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only image files are allowed'));
  }
};

// Create multer instances
export const uploadGuideImage = multer({
  storage: guideImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
}).single('image');
export const uploadGuideImages = multer({
  storage: guideImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
}).fields([
  { name: 'images',    maxCount: 10 },
  { name: 'images[0]', maxCount: 1 },
  { name: 'images[1]', maxCount: 1 },
  { name: 'images[2]', maxCount: 1 },
  { name: 'images[3]', maxCount: 1 },
  { name: 'images[4]', maxCount: 1 },
  { name: 'images[5]', maxCount: 1 },
  { name: 'images[6]', maxCount: 1 },
  { name: 'images[7]', maxCount: 1 },
  { name: 'images[8]', maxCount: 1 },
  { name: 'images[9]', maxCount: 1 }
]); 
export const uploadProgramImages = multer({
  storage: programImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
}).fields([
  { name: 'images',    maxCount: 10 },
  { name: 'images[0]', maxCount: 1 },
  { name: 'images[1]', maxCount: 1 },
  { name: 'images[2]', maxCount: 1 },
  { name: 'images[3]', maxCount: 1 },
  { name: 'images[4]', maxCount: 1 },
  { name: 'images[5]', maxCount: 1 },
  { name: 'images[6]', maxCount: 1 },
  { name: 'images[7]', maxCount: 1 },
  { name: 'images[8]', maxCount: 1 },
  { name: 'images[9]', maxCount: 1 }
]); // Allow up to 10 images

// Helper function to convert file path to URL
// This should be updated to match your application's URL structure
export const filePathToUrl = (filePath: string): string => {
  // Get the relative path from the uploads directory
  const relativePath = path.relative(uploadsBaseDir, filePath);
  // Return the URL in the format /uploads/{relativePath}
  return `/uploads/${relativePath.replace(/\\/g, '/')}`;
}; 