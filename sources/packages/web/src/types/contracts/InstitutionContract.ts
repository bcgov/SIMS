import { ProgramStatus } from "..";

export interface Institute {
  name: string;
  code?: string;
}

export interface AESTInstitutionProgramsSummaryDto {
  programId: number;
  programName: string;
  submittedDate: Date;
  locationName: string;
  programStatus: ProgramStatus;
  totalOfferings: number;
  formattedSubmittedDate: string;
  locationId: number;
}
