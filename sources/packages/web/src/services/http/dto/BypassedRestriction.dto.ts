import { RestrictionType } from "@/types";

/**
 * Base DTO for bypassed restriction
 */
export interface BypassedRestrictionBaseDTO {
  id: number;
  restrictionType: RestrictionType;
  restrictionCode: string;
}

/**
 * DTO interface for student/institution bypassed restriction summary.
 */
export interface BypassedRestrictionSummaryAPIOutDTO
  extends BypassedRestrictionBaseDTO {
  createdAt: Date;
  isActive: boolean;
}
