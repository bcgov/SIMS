import {
  AssessmentConsolidatedData,
  CredentialType,
  InstitutionTypes,
  ProgramLengthOptions,
} from "../../models/assessment.model";
import {
  Provinces,
  YesNoOptions,
  OfferingDeliveryOptions,
  AssessmentDataType,
} from "@sims/test-utils";
import {
  ApplicationEditStatus,
  ApplicationStatus,
  OfferingIntensity,
} from "@sims/sims-db";

/**
 * Create fake consolidated data
 * based on program year.
 * @param programYear program year.
 * @returns assessment consolidated data.
 */
export function createFakeAssessmentConsolidatedData(
  programYear: string,
): AssessmentConsolidatedData {
  const [programStartYear] = programYear.split("-");
  return {
    ...getDefaultAssessmentConsolidatedData(),
    applicationEditStatus: ApplicationEditStatus.Original,
    studentDataDependantstatus: "independant",
    programYear,
    programYearStartDate: `${programStartYear}-08-01`,
    studentDataRelationshipStatus: "single",
    studentDataTaxReturnIncome: 40000,
    studentDataWhenDidYouGraduateOrLeaveHighSchool: "2017-03-01",
    studentDataIndigenousStatus: YesNoOptions.No,
    studentDataHasDependents: YesNoOptions.No,
    studentDataLivingWithParents: YesNoOptions.No,
    studentDataYouthInCare: YesNoOptions.No,
    studentTaxYear: +programStartYear - 1,
    programLocation: Provinces.BritishColumbia,
    institutionLocationProvince: Provinces.BritishColumbia,
    institutionType: InstitutionTypes.BCPublic,
    programLength: ProgramLengthOptions.SixtyWeeksToTwoYears,
    programCredentialType: CredentialType.UnderGraduateDegree,
    offeringDelivered: OfferingDeliveryOptions.Onsite,
    offeringProgramRelatedCosts: 5000,
    offeringActualTuitionCosts: 20000,
    offeringMandatoryFees: 500,
    offeringExceptionalExpenses: 500,
    offeringWeeks: 16,
    studentDataApplicationPDPPDStatus: "no",
    applicationStatus: ApplicationStatus.Assessment,
    applicationHasNOAApproval: false,
    programYearTotalBookCost: 500,
    programYearTotalReturnTransportationCost: 500,
  };
}

/**
 * Create fake part time consolidated data
 * based on program year.
 * @param programYear program year.
 * @returns part time assessment consolidated data.
 */
export function createFakePartTimeAssessmentConsolidatedData(
  programYear: string,
): AssessmentConsolidatedData {
  const [programStartYear] = programYear.split("-");
  return {
    ...getDefaultAssessmentConsolidatedData(),
    studentDataDependantstatus: "independant",
    programYear,
    programYearStartDate: `${programStartYear}-08-02`,
    studentDataRelationshipStatus: "single",
    studentDataTaxReturnIncome: 40001,
    studentDataWhenDidYouGraduateOrLeaveHighSchool: "2017-03-02",
    studentDataIndigenousStatus: YesNoOptions.No,
    studentDataHasDependents: YesNoOptions.No,
    studentDataLivingWithParents: YesNoOptions.No,
    studentDataYouthInCare: YesNoOptions.No,
    studentDataAdditionalTransportRequested: YesNoOptions.No,
    studentTaxYear: +programStartYear - 1,
    programLocation: Provinces.BritishColumbia,
    institutionLocationProvince: Provinces.BritishColumbia,
    institutionType: InstitutionTypes.BCPublic,
    programLength: ProgramLengthOptions.SixtyWeeksToTwoYears,
    programCredentialType: CredentialType.UnderGraduateDegree,
    offeringDelivered: OfferingDeliveryOptions.Onsite,
    offeringProgramRelatedCosts: 5001,
    offeringActualTuitionCosts: 20001,
    offeringMandatoryFees: 501,
    offeringExceptionalExpenses: 501,
    offeringWeeks: 15,
    studentDataApplicationPDPPDStatus: "no",
    offeringCourseLoad: 40,
    studentDataCRAReportedIncome: 10001,
    partner1CRAReportedIncome: 15001,
    programYearTotalPartTimeCSGD: 200,
    programYearTotalPartTimeBCAG: 300,
    programYearTotalPartTimeSBSD: 40,
    programYearTotalFullTimeSBSD: 50,
    programYearTotalPartTimeCSGP: 60,
    programYearTotalFullTimeCSGP: 70,
    programYearTotalPartTimeCSPT: 80,
    latestCSLPBalance: 0,
  };
}
/**
 * Camunda workflow engine expects the variables which are not assigned with values
 * to be set as null.
 * @returns assessment consolidated default values.
 */
function getDefaultAssessmentConsolidatedData(): AssessmentConsolidatedData {
  return {
    appealsStudentIncomeAppealData: null,
    appealsPartnerIncomeAppealData: null,
    appealsStudentDisabilityAppealData: null,
    appealsStudentAdditionalTransportationAppealData: null,
    appealsPartnerInformationAndIncomeAppealData: null,
    appealsStudentFinancialInformationAppealData: null,
    appealsStudentHasDependentsAppealData: null,
    appealsStudentDependantsAppealData: null,
    studentDataIsYourPartnerAbleToReport: null,
    studentDataParentValidSinNumber: null,
    studentDataNumberOfParents: null,
    studentDataEstimatedSpouseIncome: null,
    studentDataLivingWithPartner: null,
    studentDataCRAReportedIncome: null,
    studentDataDependants: null,
    studentDataGovernmentFundingCosts: null,
    studentDataNonGovernmentFundingCosts: null,
    studentDataParentVoluntaryContributionsCosts: null,
    studentDataPartnerStudyWeeks: null,
    studentDataPartnerEmploymentInsurance: null,
    studentDataPartnerFedralProvincialPDReceiptCost: null,
    studentDataParentDependentTable: null,
    studentDataStudentParentNetAssests: null,
    studentDataStudentParentNetContribution: null,
    studentDataPartnerTotalIncomeAssistance: null,
    studentDataVoluntaryContributions: null,
    studentDataScholarshipAmount: null,
    studentDataStudentParentsTotalIncome: null,
    studentDataChildSupportAndOrSpousalSupport: null,
    studentDataDaycareCosts11YearsOrUnder: null,
    studentDataDaycareCosts12YearsOrOver: null,
    studentDataLivingathomeRent: null,
    studentDataSelectedOffering: null,
    studentDataAdditionalTransportKm: null,
    studentDataAdditionalTransportWeeks: null,
    studentDataAdditionalTransportPlacement: null,
    studentDataCurrentYearIncome: null,
    offeringCourseLoad: null,
    parent1Contributions: null,
    parent1Ei: null,
    parent1NetAssests: null,
    parent1Tax: null,
    parent1TotalIncome: null,
    parent1DependentTable: [],
    parent1CRAReportedIncome: null,
    parent1CppEmployment: null,
    parent1CppSelfemploymentOther: null,
    parent2Contributions: null,
    parent2CppSelfemploymentOther: null,
    parent2DependentTable: [],
    parent2Ei: null,
    parent2NetAssests: null,
    parent2Tax: null,
    parent2TotalIncome: null,
    parent2CRAReportedIncome: null,
    parent2CppEmployment: null,
    partner1SocialAssistance: null,
    partner1EmploymentInsuranceBenefits: null,
    partner1TotalStudentLoan: null,
    partner1PermanentDisabilityBenefits: null,
    partner1StudentStudyWeeks: null,
    partner1TotalIncome: null,
    partner1CRAReportedIncome: null,
    assessmentId: null,
    applicationStatus: null,
    applicationEditStatus: null,
    applicationHasNOAApproval: null,
    studentDataPartnerHasEmploymentInsuranceBenefits: null,
    studentDataPartnerHasFedralProvincialPDReceipt: null,
    studentDataPartnerHasTotalIncomeAssistance: null,
    partner1PartnerHasEmploymentInsuranceBenefits: null,
    partner1PartnerHasFedralProvincialPDReceipt: null,
    partner1PartnerHasTotalIncomeAssistance: null,
  } as AssessmentConsolidatedData;
}

/**
 * Create fake full time consolidated data
 * based on program year.
 * @param programYear program year.
 * @returns assessment consolidated data for full time application.
 */
export function createFakeConsolidatedFulltimeData(
  programYear: string,
): AssessmentConsolidatedData {
  const [, programEndYear] = programYear.split("-");
  const assessmentConsolidatedData =
    createFakeAssessmentConsolidatedData(programYear);
  assessmentConsolidatedData.offeringIntensity = OfferingIntensity.fullTime;
  assessmentConsolidatedData.offeringStudyStartDate = `${programEndYear}-02-01`;
  assessmentConsolidatedData.offeringStudyEndDate = `${programEndYear}-05-24`;
  return assessmentConsolidatedData;
}

/**
 * Create fake part time consolidated data
 * based on program year.
 * @param programYear program year.
 * @returns assessment consolidated data for part time application.
 */
export function createFakeConsolidatedPartTimeData(
  programYear: string,
): AssessmentConsolidatedData {
  const [, programEndYear] = programYear.split("-");
  const assessmentConsolidatedData =
    createFakePartTimeAssessmentConsolidatedData(programYear);
  assessmentConsolidatedData.offeringIntensity = OfferingIntensity.partTime;
  assessmentConsolidatedData.offeringStudyStartDate = `${programEndYear}-02-01`;
  assessmentConsolidatedData.offeringStudyEndDate = `${programEndYear}-05-24`;
  return assessmentConsolidatedData;
}

/**
 * Create fake single independent student data.
 * @returns consolidated data for single independent student.
 */
export function createFakeSingleIndependentStudentData(): Partial<AssessmentConsolidatedData> {
  return {
    // Single independent student.
    studentDataDependantstatus: "independant",
    studentDataRelationshipStatus: "single",
  };
}

/**
 * Provides the necessary data to the assessment workflow, defines how the parents
 * are present in the application, if they need income verification or if they are not able
 * to use a BCSC to provide data using the supporting users portal.
 * @param options creation options.
 * - `dataType` indicates which moment the assessment data should represents.
 * - `numberOfParents` generate information for one or two parents.
 * - `validSinNumber` determine if parents can have a BCSC and access the supporting users portal.
 * @returns parents data to be used.
 */
export function createParentsData(options?: {
  dataType?: AssessmentDataType;
  numberOfParents?: 1 | 2;
  validSinNumber?: YesNoOptions;
}): Partial<AssessmentConsolidatedData> {
  // Default values for options when not provided.
  const dataType = options.dataType ?? AssessmentDataType.Submit;
  const numberOfParents = options?.numberOfParents ?? 1;
  const validSinNumber = options?.validSinNumber ?? YesNoOptions.Yes;
  // Make the student a dependant.
  const parentsData = {} as Partial<AssessmentConsolidatedData>;
  parentsData.studentDataNumberOfParents = numberOfParents;
  parentsData.studentDataDependantstatus = "dependant";
  // Set additional information when parents are not able to provide
  // their income using the supporting users portal.
  if (validSinNumber === YesNoOptions.No) {
    parentsData.studentDataStudentParentsTotalIncome = 150000;
  }
  parentsData.studentDataParentValidSinNumber = validSinNumber;
  if (dataType === AssessmentDataType.Submit) {
    return parentsData;
  }
  // Create specific parent data for 1 or 2 parents.
  for (let i = 1; i <= numberOfParents; i++) {
    parentsData[`parent${i}NetAssests`] = 300000;
    parentsData[`parent${i}TotalIncome`] = 75000;
    parentsData[`parent${i}CRAReportedIncome`] = null;
    parentsData[`parent${i}CppEmployment`] = 5000;
    parentsData[`parent${i}Contributions`] = 10000;
    parentsData[`parent${i}DependentTable`] = null;
    parentsData[`parent${i}Ei`] = 0;
    parentsData[`parent${i}Tax`] = 0;
    parentsData[`parent${i}CppSelfemploymentOther`] = 200;
  }
  return parentsData;
}
