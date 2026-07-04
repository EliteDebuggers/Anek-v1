import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// Configure Multer with memory storage (no disk persistence) and a 15MB file size limit
const storage = multer.memoryStorage();

const limits = {
  fileSize: 15 * 1024 * 1024, // 15 Megabytes
};

const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Only image and video files are allowed.'), false);
  }
};

export const multerUpload = multer({
  storage,
  limits,
  fileFilter,
});

/**
 * Uploads a file buffer directly to Cloudinary.
 * @param {Buffer} fileBuffer - The memory file buffer from Multer.
 * @param {String} folder - Folder name in Cloudinary.
 * @returns {Promise<Object>} - Cloudinary upload result.
 */
export const uploadToCloudinary = (fileBuffer, folder = 'anek') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // Auto-detects image vs video
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
    
    uploadStream.end(fileBuffer);
  });
};
