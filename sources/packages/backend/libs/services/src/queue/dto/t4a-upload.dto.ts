export interface T4AUploadEnqueuerQueueInDTO {
  maxFileUploadsPerBatch: number;
}

export interface T4AUploadQueueInDTO {
  remoteFiles: string[];
  referenceDate: Date;
}
