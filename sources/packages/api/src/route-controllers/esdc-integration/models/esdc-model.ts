export interface ESDCFileResultDTO {
  generatedFile: string;
  uploadedRecords: number;
}

export interface ESDCRequestFileResultDTO extends ESDCFileResultDTO {
  offeringIntensity: string;
}
export interface ESDCFileResponseDTO {
  processSummary: string[];
  errorsSummary: string[];
}
