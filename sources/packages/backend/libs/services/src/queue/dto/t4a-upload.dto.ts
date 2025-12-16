import { v4 as uuid } from "uuid";

/**
 * Configuration for the T4A upload enqueuer responsible for
 * listing all T4A files available on the SFTP and
 * queuing them for processing.
 */
export interface T4AUploadEnqueuerQueueInDTO {
  maxFileUploadsPerBatch: number;
}

/**
 * Information about a single T4A file to be processed in the queue.
 */
export class T4AUploadFileQueueInDTO {
  /**
   * Initializes the T4A upload file queue DTO.
   * @param relativeFilePath Relative file path on the SFTP T4A IN folder.
   * The path is relative to the T4A IN folder to ensure the consumer
   * queue will look only into the configured folder, not allowing it
   * to receive files from other locations.
   */
  constructor(readonly relativeFilePath: string) {
    this.uniqueID = uuid();
  }
  /**
   * File unique ID to allow its identification in logs and processing,
   * avoiding use of file names which may contain sensitive information.
   */
  readonly uniqueID: string;
}

/**
 * Information required to process T4A file uploads in the queue.
 */
export class T4AUploadQueueInDTO {
  /**
   * Initializes the T4A upload queue DTO.
   * @param referenceDate The reference date for the upload. Allows all
   * the created files to have the same reference date, independent of
   * when they are processed.
   * @param remoteFiles The list of remote relative file paths to be uploaded.
   * A UUID will be associated with each file for identification during processing.
   */
  constructor(
    readonly referenceDate: Date,
    remoteFiles: string[],
  ) {
    this.files = remoteFiles.map(
      (filePath) => new T4AUploadFileQueueInDTO(filePath),
    );
  }
  readonly files: T4AUploadFileQueueInDTO[] = [];
}
