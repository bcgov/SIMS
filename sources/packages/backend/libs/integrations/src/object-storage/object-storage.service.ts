import { Injectable } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { ConfigService } from "@sims/utilities/config";
import { GetObjectResult, StorageObject } from "./models/object-storage.models";

/**
 * Manages the operations for the object storage.
 */
@Injectable()
export class ObjectStorageService {
  private readonly s3Client: S3Client;
  private readonly defaultBucket: string;

  constructor(configService: ConfigService) {
    const s3Config = configService.s3Configuration;
    this.defaultBucket = s3Config.defaultBucket;
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: s3Config.clientCredential.clientId,
        secretAccessKey: s3Config.clientCredential.clientSecret,
      },
      endpoint: s3Config.endpoint,
      forcePathStyle: true,
      region: s3Config.region,
    });
  }

  /**
   * Saves an object to the storage.
   * @param object object details to be stored.
   * @throws S3ServiceException base exception class for all service exceptions from S3 service.
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/command/PutObjectCommand/
   */
  async putObject(object: StorageObject): Promise<void> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.defaultBucket,
        Key: object.key,
        Body: object.body,
        ContentLength: object.body.length,
        ContentType: object.contentType,
      }),
    );
  }

  /**
   * Get an object from the storage.
   * @returns object information.
   * @throws InvalidObjectState object is archived and inaccessible until restored.
   * @throws NoSuchKey the specified key does not exist.
   * @throws S3ServiceException base exception class for all service exceptions from S3 service.
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/command/GetObjectCommand/
   */
  async getObject(objectKey: string): Promise<GetObjectResult> {
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.defaultBucket,
        Key: objectKey,
      }),
    );
    return {
      contentLength: response.ContentLength,
      contentType: response.ContentType,
      body: response.Body,
    };
  }
}
