import { Min, IsOptional } from "class-validator";
import { COEStatus } from "../../../database/entities/coe-status.type";
import { ProgramInfoStatus } from "../../../database/entities/program-info-status.type";

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
  applicationWithinCOEWindow: boolean;
  applicationLocationId: number;
  applicationDeniedReason?: string;
  studyBreaks?: StudyBreak[];
  applicationPIRStatus: ProgramInfoStatus;
  disbursementDate: string;
}

export class COEDeniedReasonAPIOutDTO {
  value: number;
  label: string;
}

export class DenyConfirmationOfEnrollmentAPIInDTO {
  @Min(1)
  coeDenyReasonId: number;
  @IsOptional()
  otherReasonDesc?: string;
}

export class ConfirmationOfEnrollmentAPIInDTO {
  @Min(0)
  tuitionRemittanceAmount: number;
}

/**
 * Read only Interface for study break item.
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
