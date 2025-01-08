import { Min, Max, IsNotEmpty, ValidateIf } from "class-validator";
import { COEStatus, DisabilityStatus, ProgramInfoStatus } from "@sims/sims-db";
import { COEApprovalPeriodStatus } from "../../../services/disbursement-schedule/disbursement-schedule.models";
import { MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE } from "../../../utilities";
import { COE_DENIED_REASON_OTHER_ID } from "@sims/utilities";

export class ApplicationDetailsForCOEAPIOutDTO {
  applicationProgramName: string;
  applicationProgramDescription: string;
  applicationOfferingName: string;
  applicationOfferingIntensity: string;
  applicationOfferingStartDate: string;
  applicationOfferingEndDate: string;
  applicationOfferingHasStudyBreak: boolean;
  applicationOfferingActualTuition: number;
  applicationOfferingProgramRelatedCost: number;
  applicationOfferingMandatoryCost: number;
  applicationOfferingExceptionalExpenses: number;
  applicationOfferingStudyDelivered: string;
  applicationStudentName: string;
  applicationNumber: string;
  applicationLocationName: string;
  applicationStatus: string;
  applicationCOEStatus: COEStatus;
  applicationId: number;
  coeApprovalPeriodStatus: COEApprovalPeriodStatus;
  applicationLocationId: number;
  applicationDeniedReason?: string;
  studyBreaks?: StudyBreak[];
  applicationPIRStatus: ProgramInfoStatus;
  disbursementDate: string;
  applicationProgramCredential: string;
  applicationProgramDelivery: string;
  maxTuitionRemittanceAllowed: number;
  hasOverawardBalance: boolean;
  disabilityProfileStatus: DisabilityStatus;
  disabilityApplicationStatus: string;
}

export class COEDeniedReasonAPIOutDTO {
  value: number;
  label: string;
}

export class DenyConfirmationOfEnrollmentAPIInDTO {
  @Min(1)
  coeDenyReasonId: number;
  @IsNotEmpty()
  @ValidateIf(
    (value: DenyConfirmationOfEnrollmentAPIInDTO) =>
      value.coeDenyReasonId === COE_DENIED_REASON_OTHER_ID,
  )
  otherReasonDesc?: string;
}

export class ConfirmationOfEnrollmentAPIInDTO {
  @Min(0)
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE)
  tuitionRemittanceAmount: number;
}

/**
 * Offering study break item.
 */
export class StudyBreak {
  breakStartDate: string;
  breakEndDate: string;
}

export class COESummaryAPIOutDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  coeStatus: COEStatus;
  fullName: string;
  disbursementScheduleId: number;
  disbursementDate: string;
}
