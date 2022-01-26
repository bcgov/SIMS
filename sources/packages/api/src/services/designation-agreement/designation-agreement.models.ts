export interface SubmitDesignationAgreementDto {
  institutionId: number;
  submittedData: any;
  submittedByUserId: number;
  submittedDate: Date;
  requestedLocationsIds: number[];
}
