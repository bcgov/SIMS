import {
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsPositive,
} from "class-validator";
import {
  OfferingStatus,
  OfferingTypes,
  ProgramInfoStatus,
} from "../../../database/entities";
import { OfferingIntensity } from "../../../database/entities/offering-intensity.type";

export class CompleteProgramInfoRequestAPIInDTO {
  @IsPositive()
  selectedOffering: number;
}

export interface ProgramInfoRequestAPOutDTO {
  offeringName: string;
  studyStartDate: Date;
  studyEndDate: Date;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  tuitionRemittanceRequestedAmount: number;
  offeringDelivered: string;
  lacksStudyDates: boolean;
  lacksStudyBreaks: boolean;
  lacksFixedCosts: boolean;
  tuitionRemittanceRequested: string;
  offeringIntensity: OfferingIntensity;
  yearOfStudy: number;
  showYearOfStudy?: boolean;
  hasOfferingWILComponent: string;
  offeringWILType?: string;
  offeringDeclaration: boolean;
  assessedBy?: string;
  assessedDate?: Date;
  offeringStatus: OfferingStatus;
  offeringType: OfferingTypes;
  selectedOffering?: number;
  selectedProgram?: number;
  institutionLocationName: string;
  applicationNumber: string;
  studentFullName: string;
  studentStudyStartDate: string;
  studentStudyEndDate: string;
  studentSelectedProgram: string;
  studentCustomProgram: string;
  studentCustomProgramDescription: string;
  pirStatus: ProgramInfoStatus;
  programYearId: number;
  pirDenyReasonId?: number;
  otherReasonDesc?: string;
  isActiveProgramYear: boolean;
  offeringIntensitySelectedByStudent: OfferingIntensity;
  programYearStartDate: Date;
  programYearEndDate: Date;
}

export interface GetPIRDeniedReasonDto {
  id: number;
  description: string;
}

export class DenyProgramInfoRequestDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  pirDenyReasonId: number;
  @IsOptional()
  otherReasonDesc?: string;
}
