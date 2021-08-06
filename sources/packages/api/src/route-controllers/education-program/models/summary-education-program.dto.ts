export class SummaryEducationProgramDto {
  id: number;
  name: string;
  credentialType: string;
  cipCode: string;
  totalOfferings: number;
  approvalStatus: string;
}

export interface SubsetEducationProgramDto {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  approvalStatus: string;
  partTimeBasisProgram: string;
}
