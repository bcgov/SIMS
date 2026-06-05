import {
  AssessmentConsolidatedData,
  CalculatedAssessmentModel,
  CredentialType,
  IdentifiableParentData,
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
  InstitutionClassification,
  InstitutionOrganizationStatus,
  OfferingIntensity,
} from "@sims/sims-db";

const DEFAULT_APPLICATION_ID = 1;

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
    applicationId: DEFAULT_APPLICATION_ID,
    applicationEditStatus: ApplicationEditStatus.Original,
    studentDataDependantstatus: "independant",
    programYear,
    programYearStartDate: `${programStartYear}-08-01`,
    studentDataRelationshipStatus: "single",
    studentDataTaxReturnIncome: 40000,
    studentDataIndigenousStatus: YesNoOptions.No,
    studentDataHasDependents: YesNoOptions.No,
    studentDataLivingAtHome: YesNoOptions.No,
    studentDataYouthInCare: YesNoOptions.No,
    studentDataAdditionalTransportRequested: YesNoOptions.No,
    studentTaxYear: +programStartYear - 1,
    institutionLocationProvince: Provinces.BritishColumbia,
    institutionType: InstitutionTypes.BCPublic,
    institutionCountry: "CA",
    institutionProvince: Provinces.BritishColumbia,
    institutionClassification: InstitutionClassification.Public,
    institutionOrganizationStatus: InstitutionOrganizationStatus.NotForProfit,
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
    applicationId: DEFAULT_APPLICATION_ID,
    applicationEditStatus: ApplicationEditStatus.Original,
    applicationStatus: ApplicationStatus.Assessment,
    studentDataDependantstatus: "independant",
    programYear,
    programYearStartDate: `${programStartYear}-08-02`,
    studentDataRelationshipStatus: "single",
    studentDataTaxReturnIncome: 40001,
    studentDataIndigenousStatus: YesNoOptions.No,
    studentDataHasDependents: YesNoOptions.No,
    studentDataYouthInCare: YesNoOptions.No,
    studentDataAdditionalTransportRequested: YesNoOptions.No,
    studentTaxYear: +programStartYear - 1,
    institutionLocationProvince: Provinces.BritishColumbia,
    institutionType: InstitutionTypes.BCPublic,
    institutionCountry: "CA",
    institutionProvince: Provinces.BritishColumbia,
    institutionClassification: InstitutionClassification.Public,
    institutionOrganizationStatus: InstitutionOrganizationStatus.NotForProfit,
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
function getDefaultAssessmentConsolidatedData(): Partial<AssessmentConsolidatedData> {
  return {
    appealsStudentIncomeAppealData: undefined, // No longer used in PY 26/27 and beyond.
    appealsPartnerIncomeAppealData: undefined, // No longer used in PY 26/27 and beyond.
    appealsStudentDisabilityAppealData: undefined, // No longer used in PY 26/27 and beyond.
    appealsStudentAdditionalTransportationAppealData: undefined, // No longer used in PY 26/27 and beyond.
    appealsPartnerInformationAndIncomeAppealData: undefined, // No longer used in PY 26/27 and beyond.
    appealsStudentFinancialInformationAppealData: undefined, // No longer used in PY 26/27 and beyond.
    appealsStudentHasDependentsAppealData: undefined, // No longer used in PY 26/27 and beyond.
    appealsStudentDependantsAppealData: undefined, // No longer used in PY 26/27 and beyond.
    appealsRoomAndBoardCostsAppealData: undefined,
    appealsStepParentWaiverAppealData: undefined,
    studentDataIsYourPartnerAbleToReport: undefined, // No longer used in PY 26/27 and beyond.
    studentDataParentValidSinNumber: undefined,
    studentDataNumberOfParents: undefined,
    studentDataEstimatedSpouseIncome: undefined, // No longer used in PY 26/27 and beyond.
    studentDataLivingWithPartner: undefined,
    studentDataCRAReportedIncome: undefined,
    studentDataDependants: undefined,
    studentDataGovernmentFundingCosts: undefined,
    studentDataNonGovernmentFundingCosts: undefined,
    studentDataParentVoluntaryContributionsCosts: undefined,
    studentDataPartnerStudyWeeks: undefined, // No longer used in PY 26/27 and beyond.
    studentDataPartnerEmploymentInsurance: undefined, // No longer used in PY 26/27 and beyond.
    studentDataPartnerFedralProvincialPDReceiptCost: undefined, // No longer used in PY 26/27 and beyond.
    studentDataPartnerChildSupportCosts: undefined, // No longer used in PY 26/27 and beyond.
    studentDataPartnerBCEAIncomeAssistanceAmount: undefined, // No longer used in PY 26/27 and beyond.
    studentDataPartnerCaringForDependant: undefined, // No longer used in PY 26/27 and beyond.
    studentDataPartnerTotalIncomeAssistance: undefined, // No longer used in PY 26/27 and beyond.
    studentDataVoluntaryContributions: undefined,
    studentDataScholarshipAmount: undefined,
    studentDataChildSupportAndOrSpousalSupport: undefined,
    studentDataDaycareCosts11YearsOrUnder: undefined,
    studentDataDaycareCosts12YearsOrOver: undefined,
    studentDataLivingAtHome: YesNoOptions.No,
    studentDataLivingAtHomeRent: undefined,
    studentDataSelectedOffering: undefined,
    studentDataAdditionalTransportRequested: YesNoOptions.No,
    studentDataAdditionalTransportKm: undefined,
    studentDataAdditionalTransportWeeks: undefined,
    studentDataAdditionalTransportPlacement: undefined,
    studentDataCurrentYearIncome: undefined,
    studentDataPartnerIsAbleToReport: undefined,
    offeringCourseLoad: undefined,
    parent1Contributions: undefined,
    parent1Ei: undefined,
    parent1NetAssets: undefined,
    parent1Tax: undefined,
    parent1TotalIncome: undefined,
    parent1DependentTable: [],
    parent1CRAReportedIncome: undefined,
    parent1CppEmployment: undefined,
    parent1CppSelfemploymentOther: undefined,
    parent2Contributions: undefined,
    parent2CppSelfemploymentOther: undefined,
    parent2DependentTable: [],
    parent2Ei: undefined,
    parent2NetAssets: undefined,
    parent2Tax: undefined,
    parent2TotalIncome: undefined,
    parent2CRAReportedIncome: undefined,
    parent2CppEmployment: undefined,
    partner1SocialAssistance: undefined,
    partner1EmploymentInsuranceBenefits: undefined,
    partner1TotalStudentLoan: undefined,
    partner1PermanentDisabilityBenefits: undefined,
    partner1StudentStudyWeeks: undefined,
    partner1TotalIncome: undefined,
    partner1CRAReportedIncome: undefined,
    partner1PartnerCaringForDependant: undefined,
    assessmentId: undefined,
    applicationStatus: undefined,
    applicationEditStatus: undefined,
    applicationHasNOAApproval: undefined,
    studentDataPartnerHasEmploymentInsuranceBenefits: undefined, // No longer used in PY 26/27 and beyond.
    studentDataPartnerHasFedralProvincialPDReceipt: undefined, // No longer used in PY 26/27 and beyond.
    studentDataPartnerHasTotalIncomeAssistance: undefined, // No longer used in PY 26/27 and beyond.
    partner1HasEmploymentInsuranceBenefits: undefined,
    partner1HasFedralProvincialPDReceipt: undefined,
    partner1HasTotalIncomeAssistance: undefined,
    institutionCountry: undefined,
    institutionProvince: undefined,
    institutionClassification: undefined,
    institutionOrganizationStatus: undefined,
  };
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
 * Create fake married independent student data.
 * @param options creation options.
 * - `partnerIsAbleToReport` indicates if the partner is able to report income.
 * - `partner1TotalIncome` total income of the partner. If not provided it will be set as 10000.
 * @returns consolidated data for married independent student.
 */
export function createFakeMarriedIndependentStudentData(options?: {
  partnerIsAbleToReport?: YesNoOptions;
  partner1TotalIncome?: number;
}): Partial<AssessmentConsolidatedData> {
  return {
    // Married independent student.
    studentDataDependantstatus: "independant",
    studentDataRelationshipStatus: "married",
    studentDataPartnerIsAbleToReport:
      options?.partnerIsAbleToReport ?? YesNoOptions.Yes,
    partner1TotalIncome: options?.partner1TotalIncome ?? 10000,
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
  const dataType = options?.dataType ?? AssessmentDataType.Submit;
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
    parentsData[`parent${i}CRAReportedIncome`] = undefined;
    parentsData[`parent${i}CppEmployment`] = 5000;
    parentsData[`parent${i}Contributions`] = 10000;
    parentsData[`parent${i}DependentTable`] = undefined;
    parentsData[`parent${i}Ei`] = 0;
    parentsData[`parent${i}Tax`] = 0;
    parentsData[`parent${i}CppSelfemploymentOther`] = 200;
  }
  return parentsData;
}

/**
 * Provides the necessary data to the assessment workflow, defining the student as dependant, and
 * create the parents data to be used in the assessment, for instance, if they can report using
 * the supporting users portal or if the student will report the parents' information on their behalf.
 * @param options creation options.
 * - `dataType` indicates which moment the assessment data should represents.
 * - `parents` parents data to be used in the assessment. If not provided, a default parent will be created.
 * - `numberOfParents` generate information for one or two parents. If provided, it will override the `parents` option.
 * @returns parents data to be used.
 */
export function createIdentifiableParentsData(options?: {
  dataType?: AssessmentDataType;
  parents?: IdentifiableParentData[];
  numberOfParents?: 1 | 2;
}): Partial<AssessmentConsolidatedData> {
  // Default values for options when not provided.
  const dataType = options?.dataType ?? AssessmentDataType.Submit;
  // Make the student a dependant.
  const parentsData = {} as Partial<AssessmentConsolidatedData>;
  parentsData.studentDataDependantstatus = "dependant";
  if (options?.numberOfParents) {
    parentsData.studentDataParents = Array.from(
      { length: options.numberOfParents },
      () => ({
        parentIsAbleToReport: YesNoOptions.Yes,
      }),
    );
  } else {
    parentsData.studentDataParents = options?.parents ?? [
      {
        parentIsAbleToReport: YesNoOptions.Yes,
      },
    ];
  }
  if (dataType === AssessmentDataType.Submit) {
    return parentsData;
  }
  // Create specific parent data for 1 or 2 parents.
  for (let i = 1; i <= parentsData.studentDataParents.length; i++) {
    parentsData[`parent${i}NetAssests`] = 300000;
    parentsData[`parent${i}TotalIncome`] = 75000;
    parentsData[`parent${i}CRAReportedIncome`] = undefined;
    parentsData[`parent${i}CppEmployment`] = 5000;
    parentsData[`parent${i}Contributions`] = 10000;
    parentsData[`parent${i}DependentTable`] = undefined;
    parentsData[`parent${i}Ei`] = 0;
    parentsData[`parent${i}Tax`] = 0;
    parentsData[`parent${i}CppSelfemploymentOther`] = 200;
  }
  return parentsData;
}

/**
 * Extracts the eligibility outcome properties from the calculated assessment
 * for all full-time award types.
 * @param calculatedAssessment the calculated assessment model containing all
 * award eligibility variables and the institution eligibility DMN results.
 * @returns a flat object with eligibility flags for each award type at the
 * assessment, institution, and final award levels.
 */
export function getFullTimeEligibilityData(
  calculatedAssessment: CalculatedAssessmentModel,
) {
  return {
    assessmentEligibilityBGPD: calculatedAssessment.assessmentEligibilityBGPD,
    institutionEligibilityBGPD:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleBGPD,
    awardEligibilityBGPD: calculatedAssessment.awardEligibilityBGPD,
    assessmentEligibilitySBSD: calculatedAssessment.assessmentEligibilitySBSD,
    institutionEligibilitySBSD:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleSBSD,
    awardEligibilitySBSD: calculatedAssessment.awardEligibilitySBSD,
    assessmentEligibilityBCAG: calculatedAssessment.assessmentEligibilityBCAG,
    institutionEligibilityBCAG:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleBCAG,
    awardEligibilityBCAG: calculatedAssessment.awardEligibilityBCAG,
    assessmentEligibilityBCAG2Year:
      calculatedAssessment.assessmentEligibilityBCAG2Year,
    // BCAG2Year is covered by dmnFullTimeAwardInstitutionEligibility.isEligibleBCAG
    awardEligibilityBCAG2Year: calculatedAssessment.awardEligibilityBCAG2Year,
    assessmentEligibilityBCSL: calculatedAssessment.assessmentEligibilityBCSL,
    institutionEligibilityBCSL:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleBCSL,
    awardEligibilityBCSL: calculatedAssessment.awardEligibilityBCSL,
    assessmentEligibilityCSGF: calculatedAssessment.assessmentEligibilityCSGF,
    institutionEligibilityCSGF:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleCSGF,
    awardEligibilityCSGF: calculatedAssessment.awardEligibilityCSGF,
    assessmentEligibilityCSGD: calculatedAssessment.assessmentEligibilityCSGD,
    institutionEligibilityCSGD:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleCSGD,
    awardEligibilityCSGD: calculatedAssessment.awardEligibilityCSGD,
    assessmentEligibilityCSGP: calculatedAssessment.assessmentEligibilityCSGP,
    institutionEligibilityCSGP:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleCSGP,
    awardEligibilityCSGP: calculatedAssessment.awardEligibilityCSGP,
    assessmentEligibilityCSLF: calculatedAssessment.assessmentEligibilityCSLF,
    institutionEligibilityCSLF:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleCSLF,
    awardEligibilityCSLF: calculatedAssessment.awardEligibilityCSLF,
  };
}
