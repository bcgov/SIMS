import {
  IERAddressInfo,
  IERAward,
} from "@sims/integrations/institution-integration/ier12-integration";
import {
  Application,
  AssessmentTriggerType,
  DisbursementSchedule,
  EducationProgram,
  EducationProgramOffering,
  FormYesNoOptions,
  FullTimeAssessment,
  RelationshipStatus,
  StudentMaritalStatusCode,
} from "@sims/sims-db";

export interface IER12Student {
  lastName: string;
  firstName?: string;
  birthDate: Date;
  sin: string;
  addressInfo: IERAddressInfo;
}

export type IER12Application = Pick<
  Application,
  | "applicationNumber"
  | "studentNumber"
  | "relationshipStatus"
  | "submittedDate"
  | "applicationStatus"
  | "applicationStatusUpdatedOn"
>;

export interface IER12Assessment {
  triggerType: AssessmentTriggerType;
  assessmentDate: Date;
  workflowData: IER12WorkflowData;
  assessmentData: IER12FullTimeAssessment;
  disbursementSchedules: IER12Disbursement[];
}

/**
 * Full-time assessment properties needed
 * for the IER12 generation.
 */
export type IER12FullTimeAssessment = Pick<
  FullTimeAssessment,
  | "studentTotalFederalContribution"
  | "studentTotalProvincialContribution"
  | "parentAssessedContribution"
  | "partnerAssessedContribution"
  | "livingAllowance"
  | "alimonyOrChildSupport"
  | "totalAssessedCost"
  | "totalAssessmentNeed"
  | "weeks"
>;

export interface IER12WorkflowData {
  studentData: {
    dependantStatus: "dependant" | "independant";
    relationshipStatus: RelationshipStatus;
    livingWithParents: FormYesNoOptions;
    numberOfParents?: number;
  };
  calculatedData: {
    parentalAssets?: number;
    studentMaritalStatusCode: StudentMaritalStatusCode;
    totalEligibleDependents?: number;
    familySize: number;
    parentalAssetContribution?: number;
    parentalContribution?: number;
    parentDiscretionaryIncome?: number;
    dependantTotalMSOLAllowance?: number;
    studentMSOLAllowance: number;
    totalChildCareCost?: number;
    totalNonEducationalCost: number;
    dependantChildQuantity?: number;
    dependantChildInDaycareQuantity?: number;
    dependantInfantQuantity?: number;
    dependantDeclaredOnTaxesQuantity?: number;
    dependantPostSecondaryQuantity?: number;
    partnerStudentStudyWeeks?: number;
  };
}

/**
 * Disbursement properties needed
 * for the IER12 generation.
 */
export type IER12Disbursement = Pick<
  DisbursementSchedule,
  | "coeStatus"
  | "disbursementScheduleStatus"
  | "disbursementDate"
  | "updatedAt"
  | "dateSent"
> & { disbursementValues: IERAward[] };

export type IER12Program = Pick<
  EducationProgram,
  | "name"
  | "description"
  | "credentialType"
  | "fieldOfStudyCode"
  | "cipCode"
  | "nocCode"
  | "sabcCode"
  | "institutionProgramCode"
  | "completionYears"
>;

export type IER12Offering = Pick<
  EducationProgramOffering,
  | "yearOfStudy"
  | "studyStartDate"
  | "studyEndDate"
  | "actualTuitionCosts"
  | "programRelatedCosts"
  | "mandatoryFees"
  | "exceptionalExpenses"
  | "offeringIntensity"
>;

/**
 * IE12 related data needed to be controlled for
 * the fixed text record assertion.
 */
export interface IER12TestInputData {
  student: IER12Student;
  application: IER12Application;
  assessment: IER12Assessment;
  educationProgram: IER12Program;
  offering: IER12Offering;
}
