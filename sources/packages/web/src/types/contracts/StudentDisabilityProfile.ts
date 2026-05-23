export interface StudentDisability {
  /**
   * Unique key used for Vue component tracking (not the server-assigned ID).
   */
  uniqueKey: number;
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
