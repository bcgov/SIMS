import { SaveEducationProgramOfferingDto } from "../../education-program-offering/models/education-program-offering.dto";
import { ProgramInfoStatus } from "../../../database/entities";

export interface CompleteProgramInfoRequestDto
  extends SaveEducationProgramOfferingDto {
  selectedProgram?: number;
  selectedOffering?: number;
}

export interface GetProgramInfoRequestDto
  extends CompleteProgramInfoRequestDto {
  institutionLocationName: string;
  applicationNumber: string;
  studentFullName: string;
  studentSelectedProgram: string;
  studentCustomProgram: string;
  studentCustomProgramDescription: string;
  studentStudyStartDate: string;
  studentStudyEndDate: string;
  pirStatus: ProgramInfoStatus;
}

export interface GetPIRDeniedReasonDto {
  id: number;
  reason: string;
}
