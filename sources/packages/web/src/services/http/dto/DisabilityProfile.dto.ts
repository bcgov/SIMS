import { DisabilityProfileStatus } from "@/types";

export interface StudentDisabilityAPIOutDTO {
  id: number;
  disabilityPriority: number;
  disabilityCategory: string;
  disabilityCategoryDescription: string;
  disabilityType: string;
  diagnosis: string[];
  diagnosisNotes?: string;
  impairments: string[];
  disabilityNotes?: string;
  impairmentsNotes?: string;
  finalNotes?: string;
}

export interface StudentDisabilityProfileAPIOutDTO {
  id: number;
  status: DisabilityProfileStatus;
  completedBy?: string;
  completedAt?: Date;
  disabilities: StudentDisabilityAPIOutDTO[];
  creator: string;
  createdAt: Date;
  modifier?: string;
  updatedAt?: Date;
}

export interface StudentDisabilityProfilesAPIOutDTO {
  profiles: StudentDisabilityProfileAPIOutDTO[];
}

export interface StudentDisabilityAPIInDTO {
  disabilityPriority: number;
  disabilityCategory: string;
  disabilityType: string;
  diagnosis: string[];
  diagnosisNotes?: string;
  impairments: string[];
  disabilityNotes?: string;
  impairmentsNotes?: string;
  finalNotes?: string;
}

/**
 * Shared payload for creating and updating student disability profiles,
 * draft or active. The presence of the id field indicates that a record
 * is expected to be updated, either a draft, or a draft to be completed
 * to active.
 */
export interface SaveStudentDisabilityProfileAPIInDTO {
  /**
   * Required when updating an existing draft profile, or completing a draft profile to active status.
   */
  id?: number;
  disabilities: StudentDisabilityAPIInDTO[];
}
