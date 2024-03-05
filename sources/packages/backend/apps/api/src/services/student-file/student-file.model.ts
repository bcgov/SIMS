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
  /**
   * Optional notification message to be sent.
   */
  saveFileUploadNotification?: (entityManager: EntityManager) => Promise<void>;
  /**
   * Optional metadata of the file being saved.
   */
  metadata?: StudentFileMetadata;
  /**
   * Optional group name of the file being saved.
   */
  groupName?: string;
}
