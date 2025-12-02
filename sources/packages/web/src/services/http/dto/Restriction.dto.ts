import { RestrictionNotificationType, RestrictionType } from "@/types";

/**
 * Base DTO for restriction
 */
export interface RestrictionBaseDTO {
  restrictionId: number;
  restrictionType: RestrictionType;
  restrictionCategory: string;
  restrictionCode: string;
  description: string;
}

/**
 * DTO interface for student/institution restriction summary.
 */
export interface RestrictionSummaryAPIOutDTO extends RestrictionBaseDTO {
  isActive: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  deletedAt?: Date;
  updatedAt?: Date;
}

/**
 * DTO interface for student/institution restriction details.
 */
export interface RestrictionDetailAPIOutDTO
  extends RestrictionSummaryAPIOutDTO {
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
export interface AssignInstitutionRestrictionAPIInDTO
  extends AssignRestrictionAPIInDTO {
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
