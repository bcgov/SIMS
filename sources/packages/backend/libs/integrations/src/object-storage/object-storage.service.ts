import { Injectable } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { ConfigService } from "@sims/utilities/config";
import { GetObjectResult, StorageObject } from "./models/object-storage.models";
import { Readable } from "stream";

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

  async putObject(object: StorageObject): Promise<void> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.defaultBucket,
          Key: object.key,
          Body: object.body,
          ContentLength: object.body.length,
          ContentType: object.contentType,
        }),
      );
    } catch (error: unknown) {
      throw new Error(
        `Error while sending object key ${object.key} to the storage.`,
        {
          cause: error,
        },
      );
    }
  }

  async getObject(objectKey: string): Promise<GetObjectResult> {
    try {
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
    } catch (error: unknown) {
      throw new Error(
        `Error while retrieving object key ${objectKey} from the storage.`,
        {
          cause: error,
        },
      );
    }
  }
}
