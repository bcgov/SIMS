import { IsEnum, IsInt, IsNotEmpty, IsOptional, Min } from "class-validator";
import {
  ProgramInfoStatus,
  ApplicationData,
  AssessmentTriggerType,
} from "../../../database/entities";

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
  studentPDStatus: boolean;
}

export class ProgramYearDetails {
  programYear: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Assessment and application information used as a main
 * source of data for assessment workflow process.
 */
export class ApplicationAssessmentDTO {
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
}

export class UpdateProgramInfoDTO {
  @IsOptional()
  @IsInt()
  @Min(1)
  programId?: number;
  @IsOptional()
  @IsInt()
  @Min(1)
  offeringId?: number;
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  locationId: number;
  @IsEnum(ProgramInfoStatus)
  status: ProgramInfoStatus;
}

export class UpdateProgramInfoStatusDto {
  @IsEnum(ProgramInfoStatus)
  status: ProgramInfoStatus;
}

export class UpdateAssessmentWorkflowIdDTO {
  @IsNotEmpty()
  workflowId: string;
}
