import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

class CloudinaryService {
  async uploadBuffer(buffer, options = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'uploads',
          resource_type: options.resourceType || 'auto',
          public_id: options.publicId,
          overwrite: options.overwrite ?? true,
          ...options,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      const readableStream = Readable.from(buffer);
      readableStream.pipe(uploadStream);
    });
  }

  async uploadImage(buffer, options = {}) {
    return this.uploadBuffer(buffer, {
      folder: 'bildyapp/images',
      resourceType: 'image',
      format: 'webp',
      ...options,
    });
  }

  async delete(publicId, resourceType = 'image') {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }
}

export default new CloudinaryService();
