import {
  AddressInfo,
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  DisbursementValue,
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
  dependantStatus: "dependant" | "independant";
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
  disbursementAwards: IERAward[];
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

export type IERAward = Pick<
  DisbursementValue,
  "valueType" | "valueCode" | "valueAmount"
>;

export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";
