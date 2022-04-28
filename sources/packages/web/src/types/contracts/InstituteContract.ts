import { ApprovalStatus } from "..";

export interface Institute {
  name: string;
  code?: string;
}

export interface AESTInstitutionProgramsSummaryDto {
  programId: number;
  programName: string;
  submittedDate: Date;
  locationName: string;
  programStatus: ApprovalStatus;
  totalOfferings: number;
  formattedSubmittedDate: string;
  locationId: number;
}
