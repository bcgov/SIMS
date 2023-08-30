import {
  AddressInfo,
  COEStatus,
  DisbursementScheduleStatus,
} from "@sims/sims-db";

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface IER12UploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

/**
 * Represents a single line in a IER 12 file.
 * When implemented in a derived class this
 * interface allow the object to be represented
 * as a formatted fixed string.
 */
export interface IER12FileLine {
  getFixedFormat(): string;
}
// TODO:All the fields which are pending for the analysis are marked as optional.
// During the implementation once after analysis is complete, please evaluate if the field is still optional.
export interface IER12Record {
  assessmentId: number;
  disbursementId: number;
  applicationNumber: string;
  institutionStudentNumber?: string;
  sin: string;
  studentLastName: string;
  studentGivenName?: string;
  birthDate: Date;
  studentGroupCode: "A" | "B";
  // Analysis pending for the field.
  studentMaritalStatusCode?: string;
  // Analysis pending for the field.
  studentDisabilityStatusCode?: string;
  // Analysis pending for the field.
  applicationDisabilityStatusFlag?: string;
  addressInfo: IERAddressInfo;
  programName: string;
  programDescription: string;
  credentialType: string;
  fieldOfStudyCode: number;
  // Analysis pending for the field.
  areaOfStudyCode?: string;
  // Analysis pending for the field.
  levelOfStudyCode?: string;
  currentProgramYear: number;
  cipCode: string;
  nocCode?: string; // TODO: Dheepak String in DB.Check if NOC Code can be optional
  sabcCode?: string; // TODO: Dheepak Check if SABC Code can be optional
  institutionProgramCode?: string; // TODO: Dheepak Check if Institution program Code can be optional
  programLength: number;
  studyStartDate: Date;
  studyEndDate: Date;
  tuitionFees: string;
  booksAndSuppliesCost: string;
  mandatoryFees: string;
  exceptionExpenses: string;
  totalFundedWeeks: number;
  courseLoad: number;
  offeringIntensityIndicator: string;
  applicationSubmittedDate: Date;
  programYear: string;
  applicationStatusCode: ApplicationStatusCode;
  applicationStatusDate: Date;
  cslAmount: number;
  bcslAmount: number;
  epAmount: number;
  provincialDefaultFlag: YNFlag;
  // Analysis pending for the field.
  federalDefaultFlag?: YNFlag;
  provincialOverawardFlag: YNFlag;
  federalOverawardFlag: YNFlag;
  restrictionFlag: YNFlag;
  scholasticStandingEffectiveDate: Date;
  // Analysis pending for the field.
  scholasticStandingCode?: string;
  assessmentDate: Date;
  withdrawalDate: Date;
  // Analysis pending for the field.
  applicantAndPartnerExpectedContribution?: number;
  // Analysis pending for the field.
  parentExpectedContribution?: number;
  // Analysis pending for the field.
  totalExpectedContribution?: number;
  // Analysis pending for the field.
  dependantChildQuantity?: number;
  // Analysis pending for the field.
  dependantChildInDaycareQuantity?: number;
  // Analysis pending for the field.
  dependentInfantQuantity?: number;
  // Analysis pending for the field.
  dependantOtherQuantity?: number;
  // Analysis pending for the field.
  dependantPostSecondaryQuantity?: number;
  // Analysis pending for the field.
  totalDependantQuantity?: number;
  // Analysis pending for the field.
  familyMembersQuantity?: number;
  // Analysis pending for the field.
  parent1Flag?: YNFlag;
  // Analysis pending for the field.
  parent2Flag?: YNFlag;
  partnerFlag: YNFlag;
  parentalAssets: string;
  // Analysis pending for the field.
  parentalAssetsExpectedContribution?: number;
  // Analysis pending for the field.
  parentalIncomeExpectedContribution?: number;
  // Analysis pending for the field.
  parentalVoluntaryContribution?: number;
  // Analysis pending for the field.
  parentalDiscretionaryIncome?: number;
  // Analysis pending for the field.
  parentalDiscretionaryAnnualIncomeFormulaResult?: number;
  // Analysis pending for the field.
  studentLivingAtHomeFlag?: YNFlag;
  // Analysis pending for the field.
  partnerInSchoolFlag?: YNFlag;
  // Analysis pending for the field.
  otherEducationalExpenses?: number;
  // Analysis pending for the field.
  totalEducationalExpenses?: number;
  // Analysis pending for the field.
  extraLocalTransportationCosts?: number;
  // Analysis pending for the field.
  extraShelterCosts?: number;
  // Analysis pending for the field.
  dependantLivingAllowance?: number;
  // Analysis pending for the field.
  studentLivingAllowance?: number;
  // Analysis pending for the field.
  totalLivingAllowance?: number;
  // Analysis pending for the field.
  alimonyCosts?: number;
  // Analysis pending for the field.
  otherDiscretionaryCosts?: number;
  // Analysis pending for the field.
  returnTransportationCosts?: number;
  // Analysis pending for the field.
  partnerStudentLoanPaymentCosts?: number;
  // Analysis pending for the field.
  childcareCosts?: number;
  // Analysis pending for the field.
  totalNonEducationalCosts?: number;
  // Analysis pending for the field.
  totalExpenses?: number;
  // Analysis pending for the field.
  assessedNeed?: number;
  // Analysis pending for the field.
  studentEligibleAward?: number;
  // Analysis pending for the field.
  mssAssessedNeedFlag?: YNFlag;
  // Analysis pending for the field.
  mssAssessedNeed?: number;
  // Analysis pending for the field.
  mssAssessedNeedNormalOrAppeal?: number;
  // Analysis pending for the field.
  mssChildcareCosts?: number;
  // Analysis pending for the field.
  mssTuitionAndSupplies?: number;
  // Analysis pending for the field.
  mssMiscCostsAllowance?: number;
  // Analysis pending for the field.
  mssTransportCostsAllowance?: number;
  // Analysis pending for the field.
  mssExtraTransportCosts?: number;
  // Analysis pending for the field.
  applicationEventCode?: string;
  // Analysis pending for the field.
  applicationEventDate?: Date;
  // Analysis pending for the field.
  documentProducedDate?: Date;
  coeStatus: COEStatus;
  disbursementScheduleStatus: DisbursementScheduleStatus;
  earliestDateOfDisbursement: Date;
  dateOfDisbursement: Date;
  // Analysis pending for the field.
  disbursementExpiryDate?: Date;
  disbursementCancelDate: Date;
  fundingDetails: Record<string, number>;
}

export enum ApplicationStatusCode {
  Submitted = "SUBM",
  InProgress = "INPR",
  Assessment = "ASMT",
  Enrolment = "COER",
  Completed = "COMP",
  Cancelled = "CANC",
}

export enum YNFlag {
  Y = "Y",
  N = "N",
}

export type IERAddressInfo = Omit<AddressInfo, "country" | "selectedCountry">;

export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";
