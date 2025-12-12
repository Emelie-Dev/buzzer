import { AuthRequest } from './asyncErrorHandler.js';
import CustomError from './CustomError.js';
import multer from 'multer';
import path from 'path';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

export default (folder: String) => {
  // Cloudinary Storage Configuration
  const onlineStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const ext = path.extname(file.originalname).replace('.', '');
      return {
        folder, // Cloudinary folder name
        format: ext, // Use the original file extension as format
        public_id: `${
          (req as AuthRequest).user?._id
        }-${Date.now()}-${Math.trunc(Math.random() * 1000000000)}`, // Unique name
        resource_type: file.mimetype.startsWith('video')
          ? 'video'
          : file.mimetype.startsWith('image')
          ? 'image'
          : 'raw',
      };
    },
  });

  return multer({
    storage:
      process.env.NODE_ENV === 'production'
        ? onlineStorage
        : multer.diskStorage({
            destination: (_, __, cb) => {
              cb(null, `src/public/${folder}`);
            },
            filename: (req, file, cb) => {
              const ext = path.extname(file.originalname);
              cb(
                null,
                `${(req as AuthRequest).user?._id}-${Date.now()}-${Math.trunc(
                  Math.random() * 1000000000
                )}${ext}`
              );
            },
          }),
    limits: { fileSize: 1_073_741_824 },
    fileFilter: (_, file, cb) => {
      const fieldnames = ['story', 'content'];
      const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/mpeg'];
      const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];

      if (fieldnames.includes(file.fieldname)) {
        if (
          !file.mimetype.startsWith('image') &&
          !videoTypes.includes(file.mimetype)
        ) {
          return cb(
            new CustomError('Please select only valid file types.', 400) as any
          );
        }
      }

      if (file.fieldname === 'sound') {
        if (!audioTypes.includes(file.mimetype)) {
          return cb(new CustomError('Invalid audio file type.', 400) as any);
        }
      }

      cb(null, true);
    },
  });
};
