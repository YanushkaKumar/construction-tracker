import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly presignedUrlExpiry: number;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('storage.endpoint'),
      region: this.configService.get<string>('storage.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('storage.accessKey') || '',
        secretAccessKey: this.configService.get<string>('storage.secretKey') || '',
      },
      forcePathStyle: this.configService.get<boolean>('storage.forcePathStyle'),
    });
    this.bucket = this.configService.get<string>('storage.bucket') || 'buildtrack-storage';
    this.presignedUrlExpiry = this.configService.get<number>('storage.presignedUrlExpiry') || 900;
  }

  /**
   * Generate a pre-signed URL for uploading a file
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<{ url: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn || this.presignedUrlExpiry,
    });

    return { url, key };
  }

  /**
   * Generate a pre-signed URL for downloading a file
   */
  async getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn || this.presignedUrlExpiry,
    });
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
    this.logger.log(`Deleted file: ${key}`);
  }

  /**
   * Generate an S3 key for a file upload
   */
  generateKey(companyId: string, path: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${companyId}/${path}/${timestamp}-${sanitizedName}`;
  }
}
