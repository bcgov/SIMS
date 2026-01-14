import {
  RestrictionActionType,
  RestrictionNotificationType,
  RestrictionType,
} from "@/types";

/**
 * Base DTO for restriction
 */
export interface RestrictionBaseAPIOutDTO {
  restrictionId: number;
  restrictionType: RestrictionType;
  restrictionCategory: string;
  restrictionCode: string;
  description: string;
}

/**
 * DTO interface for student restriction summary.
 */
export interface RestrictionSummaryAPIOutDTO extends RestrictionBaseAPIOutDTO {
  isActive: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  deletedAt?: Date;
  updatedAt?: Date;
}

/**
 * Institution restriction summary.
 */
export interface InstitutionRestrictionSummaryAPIOutDTO extends RestrictionBaseAPIOutDTO {
  locationName: string;
  programName: string;
  createdAt: Date;
  isActive: boolean;
  resolvedAt?: Date;
}

/**
 * DTO interface for student/institution restriction details.
 */
export interface RestrictionDetailAPIOutDTO extends RestrictionSummaryAPIOutDTO {
  createdBy: string;
  resolvedBy: string;
  deletedBy?: string;
  restrictionNote?: string;
  resolutionNote?: string;
  deletionNote?: string;
}

/**
 * DTO to resolve restriction to a student/institution.
 */
export interface ResolveRestrictionAPIInDTO {
  noteDescription: string;
}

/**
 * Delete a restriction from a student.
 */
export interface DeleteRestrictionAPIInDTO {
  noteDescription: string;
}

/**
 * DTO to add restriction to a student/institution.
 */
export interface AssignRestrictionAPIInDTO extends ResolveRestrictionAPIInDTO {
  restrictionId: number;
}

/**
 * Add restriction to an institution.
 */
export interface AssignInstitutionRestrictionAPIInDTO extends AssignRestrictionAPIInDTO {
  locationIds: number[];
  programId: number;
}

/**
 * Student restriction DTO.
 * This object is returned by api.
 */
export interface StudentRestrictionAPIOutDTO {
  /**
   * Restriction code.
   */
  code: string;
  /**
   * Notification type.
   */
  type: RestrictionNotificationType;
}

/**
 * Institution restriction details.
 */
export interface InstitutionRestrictionAPIOutDTO {
  restrictionActions: RestrictionActionType[];
}

/**
 * Institution restrictions.
 */
export interface InstitutionRestrictionsAPIOutDTO {
  institutionRestrictions: InstitutionRestrictionAPIOutDTO[];
}

/**
 * Active institution restriction details.
 */
export interface InstitutionActiveRestrictionAPIOutDTO {
  programId: number;
  locationId: number;
  restrictionCode: string;
  restrictionActions: RestrictionActionType[];
}

/**
 * Active institution restrictions.
 */
export interface InstitutionActiveRestrictionsAPIOutDTO {
  institutionRestrictions: InstitutionActiveRestrictionAPIOutDTO[];
}
