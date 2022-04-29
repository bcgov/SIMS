import { EducationProgramDto } from "../../route-controllers/education-program/models/save-education-program.dto";
import { ProgramStatus } from "../../database/entities";
/**
 * DTO that is used to persist the eduction programs form data.
 */
export interface SaveEducationProgram extends EducationProgramDto {
  id?: number;
  institutionId: number;
  programStatus: ProgramStatus;
  userId: number;
}

export class EducationProgramsSummary {
  id: number;
  programName: string;
  cipCode: string;
  credentialType: string;
  programStatus: string;
  totalOfferings: number;
  credentialTypeToDisplay: string;
}
