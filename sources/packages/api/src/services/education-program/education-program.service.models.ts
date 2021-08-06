import { credentialTypeToDisplay } from "../../utilities/credential-type-utils";

export interface SaveEducationProgram {
  id?: number;
  institutionId: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeOther: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  regulatoryBody: string;
  programDeliveryTypes: ProgramDeliveryTypes;
  deliveredOnlineAlsoOnsite?: string;
  sameOnlineCreditsEarned?: string;
  earnAcademicCreditsOtherInstitution?: string;
  courseLoadCalculation: string;
  averageHoursStudy: number;
  completionYears: string;
  admissionRequirement: string;
  hasMinimunAge?: string;
  eslEligibility: string;
  hasJointInstitution: string;
  hasJointDesignatedInstitution: string;
  approvalStatus: string;
  partTimeBasisProgram: string;
}

export interface ProgramDeliveryTypes {
  deliveredOnSite: boolean;
  deliveredOnline: boolean;
}

export class EducationProgramsSummary {
  id: number;
  name: string;
  cipCode: string;
  credentialType: string;
  credentialTypeOther: string;
  approvalStatus: string;
  totalOfferings: number;
  get credentialTypeToDisplay(): string {
    return credentialTypeToDisplay(
      this.credentialType,
      this.credentialTypeOther,
    );
  }
}

export class EducationProgramModel {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeOther: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  approvalStatus: string;
  partTimeBasisProgram: string;
  get credentialTypeToDisplay(): string {
    return credentialTypeToDisplay(
      this.credentialType,
      this.credentialTypeOther,
    );
  }
}
