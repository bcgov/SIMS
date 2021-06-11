export interface CreateEducationProgram {
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
