import { AssessmentTriggerType, OfferingIntensity } from "@sims/sims-db";

export enum YesNoOptions {
  Yes = "yes",
  No = "no",
}

export interface StudentDependentTable {
  dateOfBirth: string;
  attendingPostSecondarySchool: YesNoOptions;
  declaredOnTaxes: YesNoOptions;
}

/**
 * Offering delivery options.
 */
export enum OfferingDeliveryOptions {
  Onsite = "onsite",
  Online = "online",
  Blended = "blended",
}

/**
 * Data required to calculate the assessment of an application.
 */
export interface AssessmentConsolidatedData {
  studentDataDependantstatus: "dependant" | "independant";
  programYear: string;
  programYearStartDate: string; //asessment to-do: date string type if possible
  studentDataRelationshipStatus: "single" | "dependent" | "married";
  studentDataTaxReturnIncome: number;
  studentDataWhenDidYouGraduateOrLeaveHighSchool: string;
  studentDataIndigenousStatus: YesNoOptions;
  studentDataHasDependents: YesNoOptions;
  studentDataLivingWithParents: YesNoOptions;
  studentDataYouthInCare: YesNoOptions;
  studentPDStatus: boolean;
  studentTaxYear: number;
  programLocation: string; //asessment to-do:probably province enum
  institutionLocationProvince: string; //asessment to-do:probably province enum
  institutionType: string;
  programLength: string;
  programCredentialType: string;
  offeringIntensity: OfferingIntensity;
  offeringDelivered: OfferingDeliveryOptions;
  offeringStudyEndDate: string;
  offeringStudyStartDate: string;
  offeringProgramRelatedCosts: number;
  offeringActualTuitionCosts: number;
  offeringMandatoryFees: number;
  offeringExceptionalExpenses: number;
  offeringWeeks: number;
  assessmentTriggerType?: AssessmentTriggerType;
  applicationId?: number;
  appealsStudentIncomeAppealData?: unknown;
  appealsPartnerIncomeAppealData?: unknown;
  studentDataSelectedLocation?: number;
  studentDataSelectedProgram?: number;
  studentDataSelectedOffering?: number;
  studentDataIsYourSpouseACanadianCitizen?: YesNoOptions;
  studentDataParentValidSinNumber?: YesNoOptions;
  studentDataNumberOfParents?: 1 | 2;
  studentDataEstimatedSpouseIncome?: number;
  studentDataLivingWithPartner?: YesNoOptions;
  studentDataCRAReportedIncome?: number;
  studentDataDependants?: StudentDependentTable[];
  studentDataGovernmentFundingCosts?: number;
  studentDataNongovernmentFundingCosts?: number;
  studentDataParentVoluntaryContributionsCosts?: number;
  studentDataPartnerStudyWeeks?: number;
  studentDataPartnerEmploymentInsurance?: YesNoOptions;
  studentDataPartnerFedralProvincialPDReceiptCost?: number;
  studentDataParentDependentTable?: unknown;
  studentDataStudentParentNetAssests?: number;
  studentDataStudentParentNetContribution?: number;
  studentDataPartnerTotalIncomeAssistance?: number;
  studentDataVoluntaryContributions?: number;
  studentDataScholarshipAmount?: number;
  studentDataPleaseProvideAnEstimationOfYourParentsIncome?: number;
  studentDataChildSupportAndOrSpousalSupport?: number;
  studentDataDaycareCosts11YearsOrUnder?: number;
  studentDataDaycareCosts12YearsOrOver?: number;
  studentDataLivingathomeRent?: number;
  studentDataTransportationCost?: number;
  offeringCourseLoad?: number; // asessment to-do:probably number from 20-59.
  parent1SupportingUserId?: number;
  parent1Contributions?: number;
  parent1Ei?: number;
  parent1NetAssests?: number;
  parent1Tax?: number;
  parent1TotalIncome?: number;
  parent1DependentTable?: [];
  parent1CRAReportedIncome?: number;
  parent1CppEmployment?: number;
  parent1CppSelfemploymentOther?: number;
  parent2SupportingUserId?: number;
  parent2Contributions?: number;
  parent2CppSelfemploymentOther?: number;
  parent2DependentTable?: [];
  parent2Ei?: number;
  parent2NetAssests?: number;
  parent2Tax?: number;
  parent2TotalIncome?: number;
  parent2CRAReportedIncome?: number;
  parent2CppEmployment?: number;
  partner1SupportingUserId?: number;
  partner1SocialAssistance?: number;
  partner1EmploymentInsuranceBenefits?: number;
  partner1TotalStudentLoan?: number;
  partner1PermanentDisabilityBenefits?: number;
  partner1StudentStudyWeeks?: number;
  partner1CRAReportedIncome?: number;
  partner1TotalIncome?: number;
}
