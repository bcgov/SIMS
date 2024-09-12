import { StudentFileMetadata } from "@sims/sims-db";
import { EntityManager } from "typeorm";

export interface CreateFile {
  fileName: string;
  uniqueFileName: string;
  mimeType: string;
  fileContent: Buffer;
  groupName: string;
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
  /**
   * Optional entity manager to update file and data in the same transaction
   */
  entityManager?: EntityManager;
}
