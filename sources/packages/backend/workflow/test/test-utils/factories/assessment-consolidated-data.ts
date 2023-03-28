import { AssessmentConsolidatedData } from "../../models/assessment.model";
import {
  Provinces,
  YesNoOptions,
  OfferingDeliveryOptions,
} from "@sims/test-utils";
import { OfferingIntensity } from "@sims/sims-db";

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
    ...setDefaultAssessmentConsolidatedData(),
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
    studentPDStatus: false,
    studentTaxYear: +programStartYear - 1,
    programLocation: Provinces.BritishColumbia,
    institutionLocationProvince: Provinces.BritishColumbia,
    institutionType: "BC Public",
    programLength: "1YearToLessThan2Years",
    programCredentialType: "undergraduateDegree",
    offeringDelivered: OfferingDeliveryOptions.Onsite,
    offeringProgramRelatedCosts: 5000,
    offeringActualTuitionCosts: 20000,
    offeringMandatoryFees: 500,
    offeringExceptionalExpenses: 500,
    offeringWeeks: 16,
  };
}

/**
 * Camunda workflow engine expects the variables which are not assigned with values
 * to be set as null.
 * @returns assessment consolidated default values.
 */
function setDefaultAssessmentConsolidatedData(): AssessmentConsolidatedData {
  return {
    appealsStudentIncomeAppealData: null,
    appealsPartnerIncomeAppealData: null,
    studentDataIsYourSpouseACanadianCitizen: null,
    studentDataParentValidSinNumber: null,
    studentDataNumberOfParents: null,
    studentDataEstimatedSpouseIncome: null,
    studentDataLivingWithPartner: null,
    studentDataCRAReportedIncome: null,
    studentDataDependants: null,
    studentDataGovernmentFundingCosts: null,
    studentDataNongovernmentFundingCosts: null,
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
    studentDataPleaseProvideAnEstimationOfYourParentsIncome: null,
    studentDataChildSupportAndOrSpousalSupport: null,
    studentDataDaycareCosts11YearsOrUnder: null,
    studentDataDaycareCosts12YearsOrOver: null,
    studentDataLivingathomeRent: null,
    studentDataTransportationCost: null,
    studentDataSelectedOffering: null,
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

export function createFakeConsolidateDataForTwoParents() {
  return {
    parent2DependentTable: null,
    studentDataLivingWithPartner: null,
    parent1SupportingUserId: null,
    programYearStartDate: "2022-08-01",
    parent2CppSelfemploymentOther: null,
    studentDataSelectedProgram: 11,
    parent1NetAssests: null,
    studentDataRelationshipStatus: "single",
    institutionType: "BC Private",
    studentTaxYear: null,
    parent2CRAReportedIncome: null,
    parent1CRAReportedIncome: null,
    studentDataParentValidSinNumber: "yes",
    partner1TotalStudentLoan: null,
    studentDataNongovernmentFundingCosts: null,
    parent2Tax: null,
    appealsStudentIncomeAppealData: null,
    studentPDStatus: null,
    partner1SocialAssistance: null,
    studentDataLivingathomeRent: null,
    parent2TotalIncome: null,
    offeringIntensity: "Full Time",
    offeringDelivered: "onsite",
    offeringBreakStartDate: null,
    parent1CppEmployment: null,
    studentDataVoluntaryContributions: null,
    parent2Contributions: null,
    parent1Contributions: null,
    studentDataTaxReturnIncome: 100000,
    studentDataSelectedLocation: 12,
    parent1DependentTable: null,
    parent2SupportingUserId: null,
    parent2CppEmployment: null,
    offeringExceptionalExpenses: 850,
    studentDataPartnerTotalIncomeAssistance: null,
    parent1Ei: null,
    studentDataEstimatedSpouseIncome: null,
    studentDataChildSupportAndOrSpousalSupport: null,
    studentDataGovernmentFundingCosts: null,
    partner1TotalIncome: null,
    offeringStudyStartDate: "2023-03-08",
    offeringWeeks: 39,
    studentDataPartnerStudyWeeks: null,
    studentDataWhenDidYouGraduateOrLeaveHighSchool: "2023-03-01",
    studentDataYouthInCare: "no",
    applicationId: 44,
    studentDataHasDependents: "no",
    studentDataPartnerFedralProvincialPDReceiptCost: null,
    parent1Tax: null,
    studentDataNumberOfParents: 2,
    studentDataDependants: null,
    offeringStudyEndDate: "2023-11-30",
    studentDataSelectedOffering: 13,
    studentDataDaycareCosts11YearsOrUnder: null,
    offeringMandatoryFees: 500,
    partner1SupportingUserId: null,
    studentDataStudentParentNetAssests: null,
    partner1StudentStudyWeeks: null,
    partner1PermanentDisabilityBenefits: null,
    parent1TotalIncome: null,
    studentDataDependantstatus: "dependant",
    assessmentTriggerType: "Original assessment",
    studentDataIsYourSpouseACanadianCitizen: null,
    studentDataLivingWithParents: "no",
    parent2NetAssests: null,
    programLocation: null,
    studentDataCRAReportedIncome: null,
    programYear: "2022-2023",
    institutionLocationProvince: "BC",
    programLength: "5YearsOrMore",
    studentDataDaycareCosts12YearsOrOver: null,
    studentDataPleaseProvideAnEstimationOfYourParentsIncome: null,
    offeringBreakEndDate: null,
    parent2Ei: null,
    partner1EmploymentInsuranceBenefits: null,
    studentDataScholarshipAmount: null,
    partner1ChildSpousalSupportCost: null,
    offeringActualTuitionCosts: 10000,
    parent1CppSelfemploymentOther: null,
    studentDataParentDependentTable: null,
    studentDataPartnerEmploymentInsurance: null,
    partner1CRAReportedIncome: null,
    studentDataStudentParentNetContribution: null,
    offeringCourseLoad: null,
    studentDataTransportationCost: null,
    studentDataIndigenousStatus: "no",
    programCredentialType: "undergraduateDiploma",
    appealsPartnerIncomeAppealData: null,
    offeringProgramRelatedCosts: 1000,
    studentDataParentVoluntaryContributionsCosts: null,
  };
}
