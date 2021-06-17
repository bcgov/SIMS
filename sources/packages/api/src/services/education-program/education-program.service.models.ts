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
    if (this.credentialType?.toLowerCase() === "other") {
      return this.credentialTypeOther;
    }

    return this.credentialType;
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
  get credentialTypeToDisplay(): string {
    if (this.credentialType?.toLowerCase() === "other") {
      return this.credentialTypeOther;
    }
    return this.credentialType;
  }
}
