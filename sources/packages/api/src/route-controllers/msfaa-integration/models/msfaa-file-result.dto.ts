export interface MSFAAFileResultDto {
  generatedFile: string;
  uploadedRecords: number;
}

export interface MSFAAValidationResultDto extends MSFAAFileResultDto {
  offeringIntensity: string;
}
