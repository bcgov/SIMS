import { AssessmentTriggerType, OfferingIntensity } from "@sims/sims-db";
import {
  Provinces,
  YesNoOptions,
  OfferingDeliveryOptions,
} from "@sims/test-utils";

export interface StudentDependentTable {
  dateOfBirth: string;
  attendingPostSecondarySchool: YesNoOptions;
  declaredOnTaxes: YesNoOptions;
}

/**
 * Data required to calculate the assessment data of an application.
 */
export interface AssessmentConsolidatedData {
  studentDataDependantstatus: "dependant" | "independant";
  programYear: string;
  programYearStartDate: string;
  studentDataRelationshipStatus: "single" | "dependent" | "married";
  studentDataTaxReturnIncome: number;
  studentDataWhenDidYouGraduateOrLeaveHighSchool: string;
  studentDataIndigenousStatus: YesNoOptions;
  studentDataHasDependents: YesNoOptions;
  studentDataLivingWithParents: YesNoOptions;
  studentDataYouthInCare: YesNoOptions;
  studentPDStatus: boolean;
  studentTaxYear: number;
  programLocation: Provinces;
  institutionLocationProvince: Provinces;
  institutionType: string;
  programLength: string;
  programCredentialType: string;
  offeringDelivered: OfferingDeliveryOptions;
  offeringProgramRelatedCosts: number;
  offeringActualTuitionCosts: number;
  offeringMandatoryFees: number;
  offeringExceptionalExpenses: number;
  offeringWeeks: number;
  offeringIntensity?: OfferingIntensity;
  offeringStudyEndDate?: string;
  offeringStudyStartDate?: string;
  assessmentTriggerType?: AssessmentTriggerType;
  appealsStudentIncomeAppealData?: unknown;
  appealsPartnerIncomeAppealData?: unknown;
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
  offeringCourseLoad?: number;
  parent1Contributions?: number;
  parent1Ei?: number;
  parent1NetAssests?: number;
  parent1Tax?: number;
  parent1TotalIncome?: number;
  parent1DependentTable?: [];
  parent1CRAReportedIncome?: number;
  parent1CppEmployment?: number;
  parent1CppSelfemploymentOther?: number;
  parent2Contributions?: number;
  parent2CppSelfemploymentOther?: number;
  parent2DependentTable?: [];
  parent2Ei?: number;
  parent2NetAssests?: number;
  parent2Tax?: number;
  parent2TotalIncome?: number;
  parent2CRAReportedIncome?: number;
  parent2CppEmployment?: number;
  partner1SocialAssistance?: number;
  partner1EmploymentInsuranceBenefits?: number;
  partner1TotalStudentLoan?: number;
  partner1PermanentDisabilityBenefits?: number;
  partner1StudentStudyWeeks?: number;
  partner1CRAReportedIncome?: number;
  partner1TotalIncome?: number;
  assessmentId?: number;
}

export interface AssessmentModel {
  weeks: number;
  tuitionCost: number;
  childcareCost: number;
  livingAllowance: number;
  totalAssessedCost: number;
  totalFamilyIncome: number;
  totalFederalAward: number;
  otherAllowableCost: number;
  transportationCost: number;
  secondResidenceCost: number;
  totalAssessmentNeed: number;
  booksAndSuppliesCost: number;
  totalProvincialAward: number;
  alimonyOrChildSupport: number;
  federalAssessmentNeed: number;
  exceptionalEducationCost: number;
  provincialAssessmentNeed: number;
  parentAssessedContribution: number;
  partnerAssessedContribution: number;
  studentTotalFederalContribution: number;
  studentTotalProvincialContribution: number;
}

export interface CalculatedAssessmentModel {
  offeringWeeks: number;
  calculatedDataTotalTutionCost: number;
  calculatedDataChildCareCost: number;
  calculatedDataTotalMSOLAllowance: number;
  calculatedDataTotalCosts: number;
  calculatedDataTotalFamilyIncome: number;
  awardNetFederalTotalAward: number;
  calculatedDataTotalTransportationCost: number;
  calculatedDataTotalSecondResidence: number;
  caclulatedDataTotalAssessedNeed: number;
  calculatedDataTotalBookCost: number;
  awardNetProvincialTotalAward: number;
  calculatedDataTotalChildSpousalSupport: number;
  calculatedDataFederalAssessedNeed: number;
  offeringExceptionalExpenses: number;
  calculatedDataProvincialAssessedNeed: number;
  calculatedDataTotalParentalContribution: number;
  calculatedDataTotalSpouseContribution: number;
  calculatedDataTotalFederalFSC: number;
  calculatedDataTotalProvincialFSC: number;
  totalFederalContribution: number;
  totalProvincialContribution: number;
}
