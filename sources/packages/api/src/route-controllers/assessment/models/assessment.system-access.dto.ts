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
import { DynamicAPIOutDTO } from "../../../route-controllers/models/common.dto";
import {
  ProgramInfoStatus,
  ApplicationData,
  AssessmentTriggerType,
  DisbursementValueType,
  AssessmentStatus,
  SupportingUserType,
} from "../../../database/entities";

export class ProgramYearAPIOutDTO {
  programYear: string;
  startDate: Date;
  endDate: Date;
}

export class ApplicationOfferingAPIOutDTO {
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
  courseLoad?: number;
}

export class ApplicationProgramAPIOutDTO {
  programCredentialType: string;
  programLength: string;
}

export class ApplicationInstitutionAPIOutDTO {
  institutionType: string;
}

export class ApplicationLocationAPIOutDTO {
  institutionLocationProvince: string;
}

export class ApplicationStudentAPIOutDTO {
  studentPDStatus?: boolean;
  craReportedIncome?: number;
  taxYear?: number;
}

export class SupportingUserAPIOutDTO {
  id: number;
  supportingUserType: SupportingUserType;
  supportingData?: any;
  craReportedIncome?: number;
}

export class StudentAppealRequestAPIOutDTO {
  submittedData: any;
}

/**
 * Assessment and application information used as a main
 * source of data for assessment workflow process.
 */
export class ApplicationAssessmentAPIOutDTO {
  /**
   * Application associated with this application.
   */
  applicationId: number;
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
  programYear: ProgramYearAPIOutDTO;
  /**
   * Offering details for student application.
   */
  offering: ApplicationOfferingAPIOutDTO;
  /**
   * Program details for student application.
   */
  program: ApplicationProgramAPIOutDTO;
  /**
   * Institution details for student application.
   */
  institution: ApplicationInstitutionAPIOutDTO;
  /**
   * Location details for student application.
   */
  location: ApplicationLocationAPIOutDTO;
  /**
   * Student details for student application.
   */
  student: ApplicationStudentAPIOutDTO;
  /**
   * Supporting users associated with this application.
   */
  @Type(() => SupportingUserAPIOutDTO)
  supportingUsers: DynamicAPIOutDTO<SupportingUserAPIOutDTO>;
  /**
   * Approved student appeals requests.
   */
  @Type(() => StudentAppealRequestAPIOutDTO)
  appeals: DynamicAPIOutDTO<StudentAppealRequestAPIOutDTO>;
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
