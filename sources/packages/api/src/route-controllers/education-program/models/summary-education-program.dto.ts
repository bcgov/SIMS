import { ProgramIntensity } from "../../../database/entities/program-intensity.type";

export interface SubsetEducationProgramDto {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeToDisplay: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  programStatus: string;
  programIntensity: ProgramIntensity;
  institutionProgramCode?: string;
  submittedDate: Date;
  submittedBy: string;
  assessedDate?: Date;
  assessedBy?: string;
  effectiveEndDate: string;
  institutionName: string;
}
