import { FileOriginType } from "@sims/sims-db";

/**
 * Information required to create a student file,
 * uploading it to S3 and saving its record in the database.
 */
export interface CreateFile {
  /**
   * User friendly file name.
   */
  fileName: string;
  /**
   * Unique file name to identify the file
   * in the S3 storage.
   */
  uniqueFileName: string;
  /**
   * MIME type of the file being created.
   */
  mimeType: string;
  /**
   * Content of the file being created.
   */
  fileContent: Buffer;
  /**
   * Friendly name to group files.
   */
  groupName: string;
  /**
   * Origin of the file being created.
   * Most of the times files are created as temporary files from user uploads,
   * but in some cases files are created from integrations with external systems
   * (e.g., Ministry files).
   */
  fileOrigin: FileOriginType;
}
