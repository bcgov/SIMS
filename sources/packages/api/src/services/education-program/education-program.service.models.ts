import { EducationProgramDto } from "../../route-controllers/education-program/models/save-education-program.dto";
import { ProgramIntensity } from "../../database/entities/program-intensity.type";
/**
 * DTO that is used to persist the eduction programs form data.
 */
export interface SaveEducationProgram extends EducationProgramDto {
  id?: number;
  institutionId: number;
  approvalStatus: string;
}

export class EducationProgramsSummary {
  id: number;
  name: string;
  cipCode: string;
  credentialType: string;
  approvalStatus: string;
  totalOfferings: number;
}
