import { AssessmentTriggerType, OfferingIntensity } from "@sims/sims-db";
import {
  Provinces,
  YesNoOptions,
  OfferingDeliveryOptions,
} from "@sims/test-utils";
import { JSONDoc } from "@camunda8/sdk/dist/zeebe/types";

export interface StudentDependent extends JSONDoc {
  dateOfBirth: string;
  attendingPostSecondarySchool: YesNoOptions;
  declaredOnTaxes: YesNoOptions;
}

export interface StudentDependantAppealData extends JSONDoc {
  hasDependents: YesNoOptions;
  dependants: StudentDependent[];
}
export interface StudentFinancialInformationAppealData extends JSONDoc {
  taxReturnIncome: number;
  daycareCosts12YearsOrOver?: number;
  daycareCosts11YearsOrUnder?: number;
}

export enum TransportationCostSituation {
  NoLimit = "noLimit",
  EducationPlacement = "educationPlacement",
  Special = "special",
}

export interface StudentAdditionalTransportationAppealData extends JSONDoc {
  eligibleForAnAdditionalTransportationAllowance: YesNoOptions;
  transportationCostSituation?: TransportationCostSituation;
  additionalTransportCost?: number;
  additionalTransportKm?: number;
  additionalTransportWeeks?: number;
  additionalTransportPlacement?: YesNoOptions;
}

export type RelationshipStatusType = "single" | "other" | "married";

export interface PartnerInformationAndIncomeAppealData extends JSONDoc {
  relationshipStatus: RelationshipStatusType;
  partnerEstimatedIncome?: number;
}

export enum CredentialType {
  UnderGraduateCertificate = "undergraduateCertificate",
  UnderGraduateCitation = "undergraduateCitation",
  UnderGraduateDiploma = "undergraduateDiploma",
  UnderGraduateDegree = "undergraduateDegree",
  GraduateCertificate = "graduateCertificate",
  GraduateDiploma = "graduateDiploma",
  GraduateDegreeOrMasters = "graduateDegreeOrMasters",
  PostGraduateOrDoctorate = "postGraduateOrDoctorate",
  QualifyingStudies = "qualifyingStudies",
}

export enum ProgramLengthOptions {
  TwelveWeeksToFiftyTwoWeeks = "12WeeksTo52Weeks",
  FiftyThreeWeeksToFiftyNineWeeks = "53WeeksTo59Weeks",
  SixtyWeeksToTwoYears = "60WeeksToLessThan2Years",
  TwoToThreeYears = "2YearsToLessThan3Years",
  ThreeToFourYears = "3YearsToLessThan4Years",
  FourToFiveYears = "4YearsToLessThan5Years",
  FiveOrMoreYears = "5YearsOrMore",
}

export enum InstitutionTypes {
  BCPublic = "BC Public",
  BCPrivate = "BC Private",
  OutOfProvince = "Out of Province",
  UnitedStates = "United States",
  International = "International",
  InternationalMedical = "International Medical",
}

/**
 * Data required to calculate the assessment data of an application.
 */
export interface AssessmentConsolidatedData extends JSONDoc {
  studentDataDependantstatus: "dependant" | "independant";
  programYear: string;
  programYearStartDate: string;
  studentDataRelationshipStatus: RelationshipStatusType;
  studentDataTaxReturnIncome: number;
  studentDataWhenDidYouGraduateOrLeaveHighSchool: string;
  studentDataIndigenousStatus: YesNoOptions;
  studentDataHasDependents: YesNoOptions;
  studentDataLivingWithParents: YesNoOptions;
  studentDataYouthInCare: YesNoOptions;
  studentTaxYear: number;
  programLocation: Provinces;
  institutionLocationProvince: Provinces;
  institutionType: InstitutionTypes;
  programLength: ProgramLengthOptions;
  programCredentialType: CredentialType;
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
  appealsStudentIncomeAppealData?: JSONDoc;
  appealsPartnerIncomeAppealData?: JSONDoc;
  appealsStudentDisabilityAppealData?: JSONDoc;
  appealsStudentFinancialInformationAppealData?: StudentFinancialInformationAppealData;
  appealsStudentAdditionalTransportationAppealData?: StudentAdditionalTransportationAppealData;
  appealsPartnerInformationAndIncomeAppealData?: PartnerInformationAndIncomeAppealData;
  appealsStudentDependantsAppealData?: StudentDependent[];
  appealsStudentHasDependantsAppealData?: YesNoOptions;
  studentDataIsYourPartnerAbleToReport?: YesNoOptions;
  studentDataParentValidSinNumber?: YesNoOptions;
  studentDataNumberOfParents?: 1 | 2;
  studentDataEstimatedSpouseIncome?: number;
  studentDataLivingWithPartner?: YesNoOptions;
  studentDataCRAReportedIncome?: number;
  studentDataDependants?: StudentDependent[];
  studentDataGovernmentFundingCosts?: number;
  studentDataNongovernmentFundingCosts?: number;
  studentDataParentVoluntaryContributionsCosts?: number;
  studentDataPartnerStudyWeeks?: number;
  studentDataPartnerEmploymentInsurance?: YesNoOptions;
  studentDataPartnerFedralProvincialPDReceiptCost?: number;
  studentDataParentDependentTable?: JSONDoc;
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
  studentDataSelectedOffering: number;
  studentDataApplicationPDPPDStatus: string;
  studentDataEligibleForAnAdditionalTransportationAllowance: YesNoOptions;
  studentDataAdditionalTransportKm: number;
  studentDataAdditionalTransportCost: number;
  studentDataAdditionalTransportWeeks: number;
  studentDataAdditionalTransportPlacement: YesNoOptions;
  programYearTotalPartTimeCSGD: number;
  programYearTotalPartTimeSBSD: number;
  programYearTotalFullTimeSBSD: number;
  programYearTotalPartTimeCSGP: number;
  programYearTotalFullTimeCSGP: number;
  latestCSLPBalance: number;
  applicationStatus: string;
  applicationHasNOAApproval: boolean;
}

/**
 * Data required to configure the disbursements.
 */
export interface ConfigureDisbursementData extends JSONDoc {
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
  offeringWeeks: number;
  awardEligibilityCSGP: boolean;
  awardEligibilityCSGD: boolean;
  awardEligibilityCSPT: boolean;
  awardEligibilityBCAG: boolean;
  awardEligibilitySBSD: boolean;
  finalFederalAwardNetCSLPAmount: number;
  finalFederalAwardNetCSGPAmount: number;
  finalFederalAwardNetCSGDAmount: number;
  finalFederalAwardNetCSPTAmount: number;
  finalProvincialAwardNetBCAGAmount: number;
  finalProvincialAwardNetSBSDAmount: number;
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
  calculatedDataRelationshipStatus: RelationshipStatusType;
  calculatedDataPartner1TotalIncome: number;
  calculatedDataEligibleForAnAdditionalTransportationAllowance: YesNoOptions;
  calculatedDataAdditionalTransportKm: number;
  calculatedDataAdditionalTransportCost: number;
  calculatedDataAdditionalTransportWeeks: number;
  calculatedDataAdditionalTransportPlacement: boolean;
  offeringWeeks: number;
  calculatedDataTotalTutionCost: number;
  calculatedDataDaycareCosts11YearsOrUnder: number;
  calculatedDataDaycareCosts12YearsOrOver: number;
  calculatedDataChildCareCost: number;
  calculatedDataTotalChildCareCost: number;
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
  calculatedDataTotalEligibleDependants: number;
  calculatedDataDependants11YearsOrUnder: number;
  calculatedDataDependants12YearsOverOnTaxes: number;
  calculatedDataTotalEligibleDependentsForChildCare: number;
  calculatedDataFamilySize: number;
  totalFederalContribution: number;
  totalProvincialContribution: number;
  calculatedDataPDPPDStatus: boolean;
  calculatedDataTaxReturnIncome: number;

  // Common variables used in both full-time and part-time.
  // CSGP
  awardEligibilityCSGP: boolean;
  // CSGD
  awardEligibilityCSGD: boolean;
  // BCAG
  awardEligibilityBCAG: boolean;
  // SBSD
  awardEligibilitySBSD: boolean;
  // CSLP
  awardEligibilityCSLP: boolean;

  // Full time.
  // CSGP
  programYearTotalCSGP: number;
  federalAwardNetCSGPAmount: number;
  provincialAwardNetCSGPAmount: number;
  // CSGD
  federalAwardCSGDAmount: number;
  federalAwardNetCSGDAmount: number;
  provincialAwardNetCSGDAmount: number;
  // CSGF
  awardEligibilityCSGF: number;
  federalAwardNetCSGFAmount: number;
  provincialAwardNetCSGFAmount: number;
  // CSGT
  awardEligibilityCSGT: boolean;
  federalAwardNetCSGTAmount: number;
  provincialAwardNetCSGTAmount: number;
  // BCAG
  federalAwardNetBCAGAmount: number;
  provincialAwardNetBCAGAmount: number;
  // BCAG2Year
  awardEligibilityBCAG2Year: number;
  // BGPD
  awardEligibilityBGPD: boolean;
  federalAwardNetBGPDAmount: number;
  provincialAwardNetBGPDAmount: number;
  // SBSD
  programYearTotalSBSD: number;
  federalAwardNetSBSDAmount: number;
  provincialAwardNetSBSDAmount: number;

  // Part time.
  // CSLP
  federalAwardNetCSLPAmount: number;
  limitAwardCSLPRemaining: number;
  latestCSLPBalance: number;
  finalFederalAwardNetCSLPAmount: number;
  // CSPT
  awardEligibilityCSPT: boolean;
  federalAwardCSPTAmount: number;
  federalAwardNetCSPTAmount: number;
  limitAwardCSPTRemaining: number;
  finalFederalAwardNetCSPTAmount: number;
  // CSGP
  finalFederalAwardNetCSGPAmount: number;
  // CSGD
  finalFederalAwardNetCSGDAmount: number;
  // BCAG
  federalAwardBCAGAmount: number;
  limitAwardBCAGRemaining: number;
  finalProvincialAwardNetBCAGAmount: number;
  // SBSD
  finalProvincialAwardNetSBSDAmount: number;
  // Calculated Data
  calculatedDataTotalRemainingNeed1: number;
  calculatedDataTotalRemainingNeed2: number;
  calculatedDataTotalRemainingNeed3: number;
  calculatedDataTotalRemainingNeed4: number;
  calculatedDataAdditionalTransportationMax: number;
  calculatedDataAdditionalTransportationAllowance: number;
  calculatedDataTotalTransportationAllowance: number;
  // DMN Part Time Award Allowable Limits
  dmnPartTimeAwardAllowableLimits?: {
    limitAwardBCAGAmount: number;
    limitAwardCSPTAmount: number;
    limitAwardCSGDAmount: number;
    limitAwardCSGD3OrMoreChildAmount: number;
    limitAwardCSGD2OrLessChildAmount: number;
    limitAwardSBSDUnder40CourseLoadAmount: number;
    limitAwardSBSD40AndUpCourseLoadAmount: number;
    limitAwardCSLPAmount: number;
  };
  // DMN Part Time Award Family Size Variables
  dmnPartTimeAwardFamilySizeVariables?: {
    limitAwardBCAGIncomeCap: number;
    limitAwardBCAGSlope: number;
    limitAwardCSPTIncomeCap: number;
    limitAwardCSPTSlope: number;
    limitAwardCSGDIncomeCap: number;
    limitAwardCSGD3OrMoreChildSlope: number;
    limitAwardCSGD2OrLessChildSlope: number;
  };
  // DMN Part Time Program Year Maximums
  dmnPartTimeProgramYearMaximums?: {
    limitTransportationAllowance: number;
  };
  // Disbursement schedules
  disbursementSchedules: Array<unknown>;
  calculatedDataTotalAcademicExpenses: number;
}
