import { ProgramIntensity } from "../../../database/entities/program-intensity.type";

export class SummaryEducationProgramDto {
  id: number;
  name: string;
  credentialType: string;
  credentialTypeToDisplay: string;
  cipCode: string;
  totalOfferings: number;
  approvalStatus: string;
}

export interface SubsetEducationProgramDto {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeToDisplay: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  approvalStatus: string;
  programIntensity: ProgramIntensity;
  institutionProgramCode?: string;
}
