export interface StudentDisabilityAPIInDTO {
  disabilityPriority: number;
  disabilityCategory: string;
  disabilityType: string;
  diagnosis: string;
  diagnosisNotes?: string;
  impairments: string[];
  disabilityNotes?: string;
  impairmentsNotes?: string;
  additionalNotes?: string;
}

export interface SaveStudentDisabilityProfileAPIInDTO {
  /**
   * Required when updating an existing draft profile, or completing a draft profile to active status.
   */
  disabilityProfileId?: number;
  disabilities: StudentDisabilityAPIInDTO[];
}
