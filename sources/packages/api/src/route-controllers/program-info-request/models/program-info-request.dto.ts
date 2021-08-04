import { IsInt, IsNotEmpty, Min } from "class-validator";
import { SaveEducationProgramOfferingDto } from "../../../route-controllers/education-program-offering/models/education-program-offering.dto";

export class CompleteProgramInfoRequestDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  offeringId: number;
}

export interface GetProgramInfoRequestDto {
  institutionLocationName: string;
  applicationNumber: string;
  studentFullName: string;
  studentSelectedProgram: string;
  studentCustomProgram: string;
  studentCustomProgramDescription: string;
  studentStudyStartDate: string;
  studentStudyEndDate: string;
  selectedProgram: number;
  selectedOffering?: number;
}
