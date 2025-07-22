import cloudinary from '../utils/cloudinary.js';

export default (
  action: 'upload' | 'delete',
  publicId: string,
  resourceType: 'video' | 'image' | 'raw',
  filePath?: string,
  overwrite: boolean = true
) => {
  if (action === 'delete') {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } else {
    return cloudinary.uploader.upload(filePath!, {
      public_id: publicId,
      resource_type: resourceType,
      overwrite,
    });
  }
};
