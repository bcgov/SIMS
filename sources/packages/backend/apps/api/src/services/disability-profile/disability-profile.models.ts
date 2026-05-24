export interface StudentDisabilityModel {
  id?: number;
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
