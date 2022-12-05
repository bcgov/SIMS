import { StudentFileMetadata } from "@sims/sims-db";
import { EntityManager } from "typeorm";

export interface CreateFile {
  fileName: string;
  uniqueFileName: string;
  groupName: string;
  mimeType: string;
  fileContent: Buffer;
}

export interface FileUploadOptions {
  saveFileUploadNotification?: (
    entityManager: EntityManager,
  ) => Promise<number>;
  metadata?: StudentFileMetadata;
}
