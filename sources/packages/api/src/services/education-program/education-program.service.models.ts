import { EducationProgramDto } from "../../route-controllers/education-program/models/save-education-program.dto";
import { ProgramIntensity } from "../../database/entities/program-intensity.type";
import { ApprovalStatus } from "./constants";
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

export class EducationProgramModel {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  approvalStatus: string;
  programIntensity: ProgramIntensity;
  institutionProgramCode: string;
}

export class ProgramsSummary {
  programId: number;
  programName: string;
  submittedDate: Date;
  locationName: string;
  programStatus: ApprovalStatus;
  offeringsCount: number;
}

export class ProgramsSummaryPaginated {
  programsSummary: ProgramsSummary[];
  programsCount: number;
}
