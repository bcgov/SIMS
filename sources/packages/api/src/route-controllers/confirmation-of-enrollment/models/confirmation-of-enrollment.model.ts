import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsInt, Min, IsOptional } from "class-validator";
import { COEStatus } from "../../../database/entities/coe-status.type";
import { ProgramInfoStatus } from "../../../database/entities/program-info-status.type";

export interface ApplicationDetailsForCOEDTO {
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
  applicationOfferingHasTuitionRemittanceRequested: string;
  applicationOfferingTuitionRemittanceAmount: number;
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

export interface COEDeniedReasonDto {
  value: number;
  label: string;
}

export class DenyConfirmationOfEnrollmentDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @ApiProperty()
  coeDenyReasonId: number;
  @IsOptional()
  @ApiProperty()
  otherReasonDesc?: string;
}

/**
 * Read only Interface for study break item.
 */
export interface StudyBreak {
  breakStartDate: string;
  breakEndDate: string;
}
