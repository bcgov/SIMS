export interface StudentDisability {
  id: number;
  disabilityPriority: number;
  disabilityCategory: string;
  disabilityType: string;
  diagnosis: string;
  impairments: string[];
  disabilityNotes?: string;
  impairmentsNotes?: string;
}
