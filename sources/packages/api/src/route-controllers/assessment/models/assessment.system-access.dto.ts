import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import {
  ProgramInfoStatus,
  ApplicationData,
  AssessmentTriggerType,
  DisbursementValueType,
  AssessmentStatus,
  SupportingUserType,
} from "../../../database/entities";

export class ProgramYearDetails {
  programYear: string;
  startDate: Date;
  endDate: Date;
}

export class ApplicationOfferingDetails {
  id: number;
  studyStartDate: Date;
  studyEndDate: Date;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  tuitionRemittanceRequestedAmount: number;
  offeringDelivered: string;
  offeringIntensity: string;
}

export class ApplicationProgramDetails {
  programCredentialType: string;
  programLength: string;
}

export class ApplicationInstitutionDetails {
  institutionType: string;
}

export class ApplicationLocationDetails {
  institutionLocationProvince: string;
}

export class ApplicationStudentDetails {
  studentPDStatus?: boolean;
}

export class SupportingUsersAPIOutDTO {
  [k: string]: SupportingUserAPIOutDTO;
}

export class SupportingUserAPIOutDTO {
  id: number;
  supportingUserType: SupportingUserType;
  supportingData: any;
}

/**
 * Assessment and application information used as a main
 * source of data for assessment workflow process.
 */
export class ApplicationAssessmentAPIOutDTO {
  /**
   * Origin of the assessment.
   */
  triggerType: AssessmentTriggerType;
  /**
   * Application dynamic data.
   */
  data: ApplicationData;
  /**
   * Details of the program year associated with the student application.
   */
  programYear: ProgramYearDetails;
  /**
   * Offering details for student application.
   */
  offering: ApplicationOfferingDetails;
  /**
   * Program details for student application.
   */
  program: ApplicationProgramDetails;
  /**
   * Institution details for student application.
   */
  institution: ApplicationInstitutionDetails;
  /**
   * Location details for student application.
   */
  location: ApplicationLocationDetails;
  /**
   * Student details for student application.
   */
  student: ApplicationStudentDetails;
  /**
   * Supporting users associated with this application.
   */
  supportingUsers: SupportingUsersAPIOutDTO;
}

export class UpdateProgramInfoDTO {
  @IsOptional()
  @IsPositive()
  programId?: number;
  @IsOptional()
  @IsPositive()
  offeringId?: number;
  @IsPositive()
  locationId: number;
  @IsEnum(ProgramInfoStatus)
  status: ProgramInfoStatus;
}

export class UpdateProgramInfoStatusDTO {
  @IsEnum(ProgramInfoStatus)
  status: ProgramInfoStatus;
}

export class UpdateAssessmentWorkflowIdDTO {
  @IsUUID()
  workflowId: string;
}

export class UpdateAssessmentDataDTO {
  @IsNotEmptyObject()
  data: any;
}

/**
 * Values to be associated with a disbursement.
 */
export class DisbursementValueDTO {
  @IsNotEmpty()
  valueCode: string;
  @IsEnum(DisbursementValueType)
  valueType: DisbursementValueType;
  @IsNumber()
  @Min(0)
  valueAmount: number;
}

/**
 * Disbursement to be created altogether with its values.
 */
export class DisbursementScheduleDTO {
  @IsDate()
  disbursementDate: Date;
  @IsDate()
  negotiatedExpiryDate: Date;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DisbursementValueDTO)
  disbursements: DisbursementValueDTO[];
}

/**
 * Schedules to be created altogether.
 */
export class CreateDisbursementsDTO {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DisbursementScheduleDTO)
  schedules: DisbursementScheduleDTO[];
}

export class UpdateAssessmentStatusDTO {
  @IsEnum(AssessmentStatus)
  status: AssessmentStatus;
}
