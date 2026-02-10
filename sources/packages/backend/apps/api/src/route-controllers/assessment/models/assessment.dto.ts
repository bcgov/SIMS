import {
  ApplicationExceptionStatus,
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  Assessment,
  AssessmentStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  NOTE_DESCRIPTION_MAX_LENGTH,
  OfferingIntensity,
  OfferingStatus,
  StudentAppealStatus,
  StudentAssessmentStatus,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength } from "class-validator";

/**
 * Dynamic object with awards values.
 * @example
 * {
 *    disbursementReceipt1cslf: 1000,
 *    disbursementReceipt1csgp: 10001,
 *    disbursementReceipt1bcsl: 1005,
 *    disbursementReceipt1bcag: 1006,
 *    disbursementReceipt1bgpd: 1007,
 *    disbursementReceipt1sbsd: 1008,
 *    disbursementReceipt2cslf: 1000,
 *    disbursementReceipt2csgp: 10001,
 *    disbursementReceipt2bcsl: 1005,
 *    disbursementReceipt2bcag: 1006,
 *    disbursementReceipt2bgpd: 1007,
 *    disbursementReceipt2sbsd: 1008,
 *   }
 */
export type DynamicAwardValue = Record<
  string,
  string | number | Date | boolean
>;

export enum RequestAssessmentTypeAPIOutDTO {
  StudentException = "Student exceptions",
  StudentAppeal = "Student appeal",
  OfferingRequest = "Offering request",
  ApplicationOfferingChangeRequest = "Application offering change",
}

type RequestAssessmentSummaryStatus =
  | StudentAppealStatus
  | ApplicationExceptionStatus
  | OfferingStatus
  | ApplicationOfferingChangeRequestStatus;

export class RequestAssessmentSummaryAPIOutDTO {
  id: number;
  submittedDate: Date;
  status: RequestAssessmentSummaryStatus;
  requestType: RequestAssessmentTypeAPIOutDTO;
  programId?: number;
}

export class AssessmentHistorySummaryAPIOutDTO {
  assessmentId?: number;
  submittedDate: Date;
  triggerType: AssessmentTriggerType;
  assessmentDate?: Date;
  status: StudentAssessmentStatus;
  offeringId?: number;
  programId?: number;
  studentAppealId?: number;
  applicationOfferingChangeRequestId?: number;
  applicationExceptionId?: number;
  studentScholasticStandingId?: number;
  /**
   * Type of the change in the scholastic standing.
   */
  scholasticStandingChangeType?: StudentScholasticStandingChangeType;
  /**
   * Date and time when the scholastic standing was reversed.
   */
  scholasticStandingReversalDate?: Date;
  /**
   * This flag decides, the row is unsuccessful week or not.
   */
  hasUnsuccessfulWeeks?: boolean;
}

/**
 * Assessment calculations output with possible
 * adjustments for API output DTO.
 */
export type AssessmentAPIOutDTO = Omit<Assessment, "totalFamilyIncome"> & {
  /**
   * Total family income to be considered.
   * Users without proper access should see only a masked value.
   * This property overrides the original type to allow to keep
   * the property as number and also as a string, when a mask is required.
   */
  totalFamilyIncome: number | string;
  /**
   * Total additional transportation allowance calculated for the assessment.
   * This is a property calculated by the workflow output and is not part
   * of the original assessment output.
   */
  totalAdditionalTransportationAllowance?: number;
  /**
   * Return transportation cost calculated for the assessment.
   * This is a property calculated by the workflow output and is not part
   * of the original assessment output.
   */
  returnTransportationCost?: number;
  /**
   * Student dependent status from workflow data.
   * Values: "independant" or "dependant"
   */
  studentDataDependantstatus?: string;
  /**
   * Family size calculated by the workflow.
   */
  calculatedDataFamilySize?: number;
  /**
   * Total number of eligible dependants calculated by the workflow.
   */
  calculatedDataTotalEligibleDependants?: number;
  /**
   * Living allowance category calculated by the workflow.
   * Values: "M", "SP", "SIA", "SIH", "SDA", "SDH"
   */
  calculatedDataLivingCategory?: string;
  /**
   * Government funding costs from student data.
   */
  studentDataGovernmentFundingCosts?: number;
  /**
   * Indicates whether the interface policy applies to the assessment.
   */
  calculatedDataInterfacePolicyApplies?: boolean;
  /**
   * Interface child care costs calculated by the workflow.
   */
  calculatedDataInterfaceChildCareCosts?: number;
  /**
   * Interface transportation amount calculated by the workflow.
   */
  calculatedDataInterfaceTransportationAmount?: number;
  /**
   * Interface additional transportation amount calculated by the workflow.
   */
  calculatedDataInterfaceAdditionalTransportationAmount?: number;
  /**
   * Interface need amount calculated by the workflow.
   */
  calculatedDataInterfaceNeed?: number;
  /**
   * Interface total assessed cost calculated by the workflow.
   */
  interfaceTotalAssessedCost?: number;
};

export class AssessmentNOAAPIOutDTO {
  @ApiProperty({
    description:
      "Dynamic output of the workflow calculation. " +
      "Contains data that could represent a part-time or a full-time assessment. " +
      "Part-time and full-time will have some common and some specific properties for each payload.",
  })
  assessment: AssessmentAPIOutDTO;
  applicationId: number;
  applicationNumber: string;
  applicationCurrentAssessmentId: number;
  fullName: string;
  programName: string;
  locationName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
  eligibleAmount: number;
  disbursement: DynamicAwardValue;
  noaApprovalStatus: AssessmentStatus;
  applicationStatus: ApplicationStatus;
  offeringName: string;
}

/**
 * Award summary for an Assessment.
 */
export class AwardDetailsAPIOutDTO {
  applicationNumber: string;
  applicationStatus: ApplicationStatus;
  institutionName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
  firstDisbursement: AwardDisbursementScheduleAPIOutDTO;
  secondDisbursement?: AwardDisbursementScheduleAPIOutDTO;
}

/**
 * Disbursement schedule details for the award summary.
 */
export class AwardDisbursementScheduleAPIOutDTO {
  disbursementDate: string;
  status: DisbursementScheduleStatus;
  coeStatus: COEStatus;
  msfaaNumber: string;
  msfaaId: number;
  msfaaCancelledDate: string;
  msfaaDateSigned: string;
  tuitionRemittance: number;
  enrolmentDate: Date;
  id: number;
  statusUpdatedOn: Date;
  dateSent?: Date;
  documentNumber?: number;
  disbursementValues: AwardDisbursementValueAPIOutDTO[];
  receiptReceived: boolean;
}

/**
 * Disbursement values for the award summary.
 */
export class AwardDisbursementValueAPIOutDTO {
  valueCode: string;
  valueAmount: number;
  effectiveAmount?: number;
  hasRestrictionAdjustment?: boolean;
  hasDisbursedAdjustment?: boolean;
  hasPositiveOverawardAdjustment?: boolean;
  hasNegativeOverawardAdjustment?: boolean;
}

export class ManualReassessmentAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}
