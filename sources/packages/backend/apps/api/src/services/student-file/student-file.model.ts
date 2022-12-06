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
   * optional notification message to be sent
   */
  saveFileUploadNotification?: (entityManager: EntityManager) => Promise<void>;
  /**
   * optional metadata of the file being saved.
   */
  metadata?: StudentFileMetadata;
}
