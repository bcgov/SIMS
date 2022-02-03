import { EducationProgramDto } from "../../route-controllers/education-program/models/save-education-program.dto";
import { ApprovalStatus } from "../../services/education-program/constants";
/**
 * DTO that is used to persist the eduction programs form data.
 */
export interface SaveEducationProgram extends EducationProgramDto {
  id?: number;
  institutionId: number;
  approvalStatus: ApprovalStatus;
}

export class EducationProgramsSummary {
  id: number;
  name: string;
  cipCode: string;
  credentialType: string;
  approvalStatus: string;
  totalOfferings: number;
  credentialTypeToDisplay: string;
}