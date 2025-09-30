/**
 * Image processing utilities for security and privacy
 */

import sharp from 'sharp';
import { createHash } from 'crypto';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  removeExif?: boolean;
  watermark?: {
    text?: string;
    image?: Buffer;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
  };
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasExif: boolean;
  exifData?: Record<string, any>;
}

export interface ProcessedImage {
  buffer: Buffer;
  metadata: ImageMetadata;
  hash: string;
  warnings: string[];
}

/**
 * Image processor class for handling security and privacy concerns
 */
export class ImageProcessor {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
  private static readonly DEFAULT_MAX_WIDTH = 2048;
  private static readonly DEFAULT_MAX_HEIGHT = 2048;
  private static readonly DEFAULT_QUALITY = 85;

  /**
   * Process image with security and privacy measures
   */
  static async processImage(
    inputBuffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const warnings: string[] = [];

    // Validate file size
    if (inputBuffer.length > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Get initial metadata
    const sharpInstance = sharp(inputBuffer);
    const metadata = await sharpInstance.metadata();

    if (!metadata.format || !this.ALLOWED_FORMATS.includes(metadata.format)) {
      throw new Error(`Unsupported image format: ${metadata.format}`);
    }

    // Check for EXIF data
    const hasExif = !!(metadata.exif || metadata.icc || metadata.iptc || metadata.xmp);
    if (hasExif) {
      warnings.push('Image contains metadata that may include personal information');
    }

    // Extract EXIF data for analysis (before removal)
    const exifData = await this.extractExifData(inputBuffer);
    
    // Check for potentially sensitive EXIF data
    if (exifData) {
      if (exifData.gps) {
        warnings.push('Image contains GPS location data');
      }
      if (exifData.camera) {
        warnings.push('Image contains camera information');
      }
      if (exifData.software) {
        warnings.push('Image contains software information');
      }
      if (exifData.timestamp) {
        warnings.push('Image contains timestamp information');
      }
    }

    // Set processing options
    const {
      maxWidth = this.DEFAULT_MAX_WIDTH,
      maxHeight = this.DEFAULT_MAX_HEIGHT,
      quality = this.DEFAULT_QUALITY,
      format = metadata.format as 'jpeg' | 'png' | 'webp',
      removeExif = true,
    } = options;

    // Process image
    let processedImage = sharpInstance;

    // Resize if necessary
    if (metadata.width && metadata.height) {
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        processedImage = processedImage.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
        warnings.push(`Image resized from ${metadata.width}x${metadata.height} to fit within ${maxWidth}x${maxHeight}`);
      }
    }

    // Remove EXIF data if requested
    if (removeExif) {
      processedImage = processedImage.withMetadata({
        exif: {},
        icc: undefined,
        iptc: undefined,
        xmp: undefined,
      });
    }

    // Apply format and quality settings
    switch (format) {
      case 'jpeg':
        processedImage = processedImage.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        processedImage = processedImage.png({ compressionLevel: 9 });
        break;
      case 'webp':
        processedImage = processedImage.webp({ quality });
        break;
    }

    // Add watermark if specified
    if (options.watermark) {
      processedImage = await this.addWatermark(processedImage, options.watermark);
    }

    // Generate final buffer
    const outputBuffer = await processedImage.toBuffer();
    
    // Get final metadata
    const finalMetadata = await sharp(outputBuffer).metadata();
    
    // Generate hash for deduplication
    const hash = this.generateImageHash(outputBuffer);

    return {
      buffer: outputBuffer,
      metadata: {
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
        format: finalMetadata.format || format,
        size: outputBuffer.length,
        hasExif: false, // Always false after processing
        exifData: removeExif ? undefined : exifData,
      },
      hash,
      warnings,
    };
  }

  /**
   * Extract EXIF data from image
   */
  private static async extractExifData(buffer: Buffer): Promise<Record<string, any> | null> {
    try {
      const metadata = await sharp(buffer).metadata();
      const exifData: Record<string, any> = {};

      if (metadata.exif) {
        // Parse EXIF data (simplified - in production, use a proper EXIF parser)
        const exifBuffer = metadata.exif;
        
        // Check for GPS data
        if (exifBuffer.includes(Buffer.from('GPS'))) {
          exifData.gps = true;
        }

        // Check for camera make/model
        if (exifBuffer.includes(Buffer.from('Canon')) || 
            exifBuffer.includes(Buffer.from('Nikon')) ||
            exifBuffer.includes(Buffer.from('Sony'))) {
          exifData.camera = true;
        }

        // Check for software info
        if (exifBuffer.includes(Buffer.from('Adobe')) ||
            exifBuffer.includes(Buffer.from('Photoshop'))) {
          exifData.software = true;
        }

        // Check for timestamp
        if (exifBuffer.includes(Buffer.from('DateTime'))) {
          exifData.timestamp = true;
        }
      }

      return Object.keys(exifData).length > 0 ? exifData : null;
    } catch (error) {
      console.warn('Failed to extract EXIF data:', error);
      return null;
    }
  }

  /**
   * Add watermark to image
   */
  private static async addWatermark(
    image: sharp.Sharp,
    watermark: NonNullable<ImageProcessingOptions['watermark']>
  ): Promise<sharp.Sharp> {
    if (watermark.text) {
      // Text watermark
      const svg = `
        <svg width="200" height="50">
          <text x="10" y="30" font-family="Arial" font-size="16" fill="rgba(255,255,255,${watermark.opacity || 0.5})">
            ${watermark.text}
          </text>
        </svg>
      `;
      
      const textBuffer = Buffer.from(svg);
      
      return image.composite([{
        input: textBuffer,
        gravity: this.getGravityFromPosition(watermark.position || 'bottom-right'),
      }]);
    }

    if (watermark.image) {
      // Image watermark
      return image.composite([{
        input: watermark.image,
        gravity: this.getGravityFromPosition(watermark.position || 'bottom-right'),
        blend: 'over',
      }]);
    }

    return image;
  }

  /**
   * Convert position to Sharp gravity
   */
  private static getGravityFromPosition(position: string): string {
    switch (position) {
      case 'top-left': return 'northwest';
      case 'top-right': return 'northeast';
      case 'bottom-left': return 'southwest';
      case 'bottom-right': return 'southeast';
      case 'center': return 'center';
      default: return 'southeast';
    }
  }

  /**
   * Generate perceptual hash for image deduplication
   */
  private static generateImageHash(buffer: Buffer): string {
    // Simple hash based on buffer content
    // In production, consider using perceptual hashing algorithms
    return createHash('sha256').update(buffer).digest('hex').substring(0, 16);
  }

  /**
   * Validate image file
   */
  static async validateImage(buffer: Buffer): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check file size
      if (buffer.length > this.MAX_FILE_SIZE) {
        errors.push(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      // Check if it's a valid image
      const metadata = await sharp(buffer).metadata();
      
      if (!metadata.format) {
        errors.push('Invalid image file');
        return { isValid: false, errors, warnings };
      }

      if (!this.ALLOWED_FORMATS.includes(metadata.format)) {
        errors.push(`Unsupported image format: ${metadata.format}`);
      }

      // Check dimensions
      if (metadata.width && metadata.height) {
        if (metadata.width > 10000 || metadata.height > 10000) {
          errors.push('Image dimensions are too large');
        }
        
        if (metadata.width < 10 || metadata.height < 10) {
          warnings.push('Image dimensions are very small');
        }
      }

      // Check for EXIF data
      if (metadata.exif || metadata.icc || metadata.iptc || metadata.xmp) {
        warnings.push('Image contains metadata that will be removed for privacy');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push('Failed to process image file');
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Generate thumbnail
   */
  static async generateThumbnail(
    buffer: Buffer,
    size: number = 150
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .withMetadata({
        exif: {},
        icc: undefined,
        iptc: undefined,
        xmp: undefined,
      })
      .toBuffer();
  }

  /**
   * Detect potentially inappropriate content (placeholder)
   */
  static async detectInappropriateContent(buffer: Buffer): Promise<{
    isAppropriate: boolean;
    confidence: number;
    reasons: string[];
  }> {
    // Placeholder for content moderation
    // In production, integrate with services like AWS Rekognition, Google Vision API, etc.
    
    try {
      const metadata = await sharp(buffer).metadata();
      
      // Basic checks
      const reasons: string[] = [];
      
      // Check if image is too small (might be tracking pixel)
      if (metadata.width && metadata.height && metadata.width < 10 && metadata.height < 10) {
        reasons.push('Image is suspiciously small');
      }

      return {
        isAppropriate: reasons.length === 0,
        confidence: 0.5, // Placeholder confidence
        reasons,
      };
    } catch (error) {
      return {
        isAppropriate: false,
        confidence: 0,
        reasons: ['Failed to analyze image content'],
      };
    }
  }

  /**
   * Extract text from image (OCR placeholder)
   */
  static async extractText(buffer: Buffer): Promise<{
    text: string;
    confidence: number;
    containsPII: boolean;
    piiTypes: string[];
  }> {
    // Placeholder for OCR functionality
    // In production, integrate with services like Tesseract, AWS Textract, etc.
    
    return {
      text: '',
      confidence: 0,
      containsPII: false,
      piiTypes: [],
    };
  }
}

/**
 * Image upload security middleware
 */
export class ImageUploadSecurity {
  /**
   * Validate and process uploaded image
   */
  static async processUpload(
    file: File | Buffer,
    options: ImageProcessingOptions & {
      allowedTypes?: string[];
      maxSize?: number;
      requireProcessing?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    processedImage?: ProcessedImage;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Convert File to Buffer if necessary
      const buffer = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());

      // Validate image
      const validation = await ImageProcessor.validateImage(buffer);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);

      if (!validation.isValid) {
        return { success: false, errors, warnings };
      }

      // Process image
      const processedImage = await ImageProcessor.processImage(buffer, {
        removeExif: true,
        ...options,
      });

      warnings.push(...processedImage.warnings);

      // Check for inappropriate content
      const contentCheck = await ImageProcessor.detectInappropriateContent(processedImage.buffer);
      if (!contentCheck.isAppropriate) {
        errors.push('Image content is not appropriate');
        warnings.push(...contentCheck.reasons);
      }

      return {
        success: errors.length === 0,
        processedImage: errors.length === 0 ? processedImage : undefined,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors, warnings };
    }
  }

  /**
   * Generate secure filename
   */
  static generateSecureFilename(originalName: string, hash: string): string {
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    return `${hash}_${timestamp}_${randomSuffix}.${extension}`;
  }

  /**
   * Check if file type is allowed
   */
  static isAllowedFileType(filename: string, allowedTypes: string[] = ['jpg', 'jpeg', 'png', 'webp']): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
  }
}