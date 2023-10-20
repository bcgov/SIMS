import {
  IERAddressInfo,
  IERAward,
} from "@sims/integrations/institution-integration/ier12-integration";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  DisbursementSchedule,
  FullTimeAssessment,
  OfferingIntensity,
  RelationshipStatus,
  WorkflowData,
} from "@sims/sims-db";

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

/**
 * IE12 related data needed to be controlled for
 * the fixed text record assertion.
 */
export interface IER12TestInputData {
  student: {
    lastName: string;
    firstName?: string;
    birthDate: Date;
    sin: string;
    addressInfo: IERAddressInfo;
  };
  application: {
    applicationNumber: string;
    studentNumber?: string;
    relationshipStatus: RelationshipStatus;
    submittedDate: Date;
    status: ApplicationStatus;
    statusDate: Date;
    programYear: string;
  };
  assessment: {
    triggerType: AssessmentTriggerType;
    assessmentDate: Date;
    workflowData: WorkflowData;
    assessmentData: IER12FullTimeAssessment;
    disbursements: IER12Disbursement[];
  };
  educationProgram: {
    name: string;
    description?: string;
    credentialType: string;
    fieldOfStudyCode: number;
    cipCode: string;
    nocCode: string;
    sabcCode: string;
    institutionProgramCode?: string;
    completionYears: string;
    offering: {
      yearOfStudy: number;
      studyStartDate: Date;
      studyEndDate: Date;
      actualTuitionCosts: number;
      programRelatedCosts: number;
      mandatoryFees: number;
      exceptionalExpenses: number;
      offeringIntensity: OfferingIntensity;
    };
  };
}
