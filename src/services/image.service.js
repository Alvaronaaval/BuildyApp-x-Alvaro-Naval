import sharp from 'sharp';

class ImageService {

  async optimize(buffer, options = {}) {
    const {
      format = 'webp',
      quality = 80,
      maxWidth = 800,
      maxHeight = 800,
    } = options;

    let pipeline = sharp(buffer).resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9 });
        break;
    }

    return pipeline.toBuffer();
  }

  async thumbnail(buffer, size = 150) {
    return sharp(buffer)
      .resize(size, size, { fit: 'cover' })
      .webp({ quality: 70 })
      .toBuffer();
  }

  async getMetadata(buffer) {
    return sharp(buffer).metadata();
  }
}

export default new ImageService();
