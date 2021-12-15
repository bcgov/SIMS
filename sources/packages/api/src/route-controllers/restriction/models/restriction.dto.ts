import { RestrictionType } from "../../../database/entities";

/**
 * DTO interface for student restriction summary.
 */
export interface StudentRestrictionSummary {
  restrictionId: number;
  restrictionType: RestrictionType;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
