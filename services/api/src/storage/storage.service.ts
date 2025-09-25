import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('S3_BUCKET');
    
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      region: this.configService.get<string>('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY'),
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async generateUploadUrl(folder: string, fileExtension: string = 'jpg'): Promise<{
    uploadUrl: string;
    fileUrl: string;
    key: string;
  }> {
    const key = `${folder}/${uuidv4()}.${fileExtension}`;
    
    const putCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: `image/${fileExtension}`,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, putCommand, {
      expiresIn: 600, // 10 minutes
    });

    const fileUrl = `${this.configService.get<string>('S3_ENDPOINT')}/${this.bucketName}/${key}`;

    return {
      uploadUrl,
      fileUrl,
      key,
    };
  }

  async generateDownloadUrl(key: string): Promise<string> {
    const getCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, getCommand, {
      expiresIn: 3600, // 1 hour
    });
  }

  async deleteFile(key: string): Promise<void> {
    // Implementation for file deletion if needed
    // For now, we'll keep files for audit purposes
  }
}