export interface ESDCFileResultDTO {
  generatedFile: string;
  uploadedRecords: number;
}

export interface ProcessSFTPResponseDTO {
  processSummary: string[];
  errorsSummary: string[];
}
