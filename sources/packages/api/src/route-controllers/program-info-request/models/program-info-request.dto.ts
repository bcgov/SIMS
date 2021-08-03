import { IsInt, IsNotEmpty, Min } from "class-validator";

export class CompleteProgramInfoRequestDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  offeringId: number;
}

export class GetProgramInfoRequestDto {
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
