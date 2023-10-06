import {
  AddressInfo,
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  DisbursementValue,
  StudentMaritalStatusCode,
  StudentScholasticStandingChangeType,
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
export interface IER12Record {
  assessmentId: number;
  disbursementId: number;
  applicationNumber: string;
  institutionStudentNumber?: string;
  sin: string;
  studentLastName: string;
  studentGivenName?: string;
  studentBirthDate: Date;
  studentDependantStatus: "dependant" | "independant";
  studentMaritalStatusCode: StudentMaritalStatusCode;
  studentAndSupportingUserContribution: number;
  parentExpectedContribution?: number;
  totalEligibleDependents?: number;
  familySize: number;
  parentalAssetContribution?: number;
  parentalContribution?: number;
  parentDiscretionaryIncome?: number;
  studentLivingWithParents: boolean;
  dependantTotalMSOLAllowance?: number;
  studentMSOLAllowance: number;
  totalLivingAllowance: number;
  alimonyCost?: number;
  childcareCost?: number;
  totalNonEducationalCost: number;
  totalAssessedCost: number;
  totalAssessmentNeed: number;
  addressInfo: IERAddressInfo;
  programName: string;
  programDescription: string;
  credentialType: string;
  fieldOfStudyCode: number;
  currentProgramYear: number;
  cipCode: string;
  nocCode?: string;
  sabcCode?: string;
  institutionProgramCode?: string;
  programCompletionYears: string;
  studyStartDate: Date;
  studyEndDate: Date;
  tuitionFees: number;
  booksAndSuppliesCost: number;
  mandatoryFees: number;
  exceptionExpenses: number;
  totalFundedWeeks: number;
  applicationSubmittedDate: Date;
  programYear: string;
  applicationStatus: ApplicationStatus;
  applicationStatusDate: Date;
  assessmentAwards: IERAward[];
  hasProvincialDefaultRestriction: boolean;
  hasProvincialOveraward: boolean;
  hasFederalOveraward: boolean;
  hasRestriction: boolean;
  assessmentTriggerType: AssessmentTriggerType;
  scholasticStandingChangeType?: StudentScholasticStandingChangeType;
  assessmentDate: Date;
  hasPartner: boolean;
  parentalAssets?: number;
  coeStatus: COEStatus;
  disbursementScheduleStatus: DisbursementScheduleStatus;
  earliestDateOfDisbursement: Date;
  dateOfDisbursement?: Date;
  disbursementCancelDate?: Date;
  disbursementSentDate?: Date;
  disbursementAwards: IERAward[];
  applicationEventCode: ApplicationEventCode;
}

export enum ApplicationStatusCode {
  Submitted = "SUBM",
  InProgress = "INPR",
  Assessment = "ASMT",
  Enrolment = "COER",
  Completed = "COMP",
  Cancelled = "CANC",
}

export enum ScholasticStandingCode {
  /**
   * Unsuccessful completion.
   */
  UC = "UC",
  /**
   * Early completion.
   */
  EC = "EC",
  /**
   * Change in intensity.
   */
  CI = "CI",
}

export enum YNFlag {
  Y = "Y",
  N = "N",
}

export type IERAddressInfo = Omit<AddressInfo, "country" | "selectedCountry">;

export type IERAward = Pick<
  DisbursementValue,
  "valueType" | "valueCode" | "valueAmount"
>;

export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";

/**
 * Application event code for IER file.
 */
export enum ApplicationEventCode {
  /**
   * Disbursement was configured as a result of the initial
   * assessment and waiting for the 21 day prior to study start
   * date to issue COE request.
   */
  ASMT = "ASMT",
  /**
   * Disbursement configuration has bee updated due to a reassessment
   * resulting from an incomplete application has been edited.
   */
  REIA = "REIA",
  /**
   * A COE request has been generated and sent to school.
   */
  COER = "COER",
  /**
   * A COE request has been approved by school.
   */
  COEA = "COEA",
  /**
   * A COE request has been denied by school.
   */
  COED = "COED",
  /**
   * A disbursement has been sent but generated errors
   * on the Finastra end (eCert and MSFAA feedback file
   * errors detected)
   */
  DISE = "DISE",
  /**
   *A disbursement has not been sent to Finastra
   * because of restriction.
   */
  DISR = "DISR",
  /**
   * A disbursement has been sent to Finastra
   * but some funding was withheld due to restriction.
   */
  DISW = "DISW",
  /**
   * A disbursement has been sent to Finastra
   * (which we treat as = student receiving the money).
   */
  DISS = "DISS",
  /**
   * A disbursement request was cancelled.
   */
  DISC = "DISC",
}
