export interface SummaryEducationProgramDto {
  id: number;
  name: string;
  credentialType: string;
  credentialTypeOther: string;
  cipCode: string;
  offeringsCount: number;
  approvalStatus: string;
}

export interface EducationProgramDto {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeOther: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  approvalStatus: string;
}
