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
  approvalStatus: string;
  programIntensity: ProgramIntensity;
  institutionProgramCode?: string;
  institutionId: number;
  institutionName: string;
  submittedOn: Date;
  submittedByFirstName: string;
  submittedLastName: string;
  deniedOn?: Date;
  deniedByFirstName?: string;
  deniedByLastName?: string;
  approvedOn?: Date;
  approvedByFirstName?: string;
  approvedByLastName?: string;
  effectiveEndDate: Date;
}
