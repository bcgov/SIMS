import {
  ProgramCalculatedDataKey,
  ProgramEvaluationResult,
  ProgramIntensity,
  ProgramStatus,
} from "@/types";

/**
 * Values pre-populated into the program data only to execute the
 * client and server side validations. Never changed by the user
 * and never persisted.
 */
export interface EducationProgramContextAPIOutDTO {
  hasOfferings: boolean;
  isActive: boolean;
  isBCPrivate: boolean;
  isBCPublic: boolean;
  isBCInstitution: boolean;
}

/**
 * Dynamic program data, whose shape is defined by the program
 * configuration schemas, plus the pre-populated context.
 */
export interface EducationProgramDataAPIOutDTO {
  [key: string]: unknown;
  context: EducationProgramContextAPIOutDTO;
}

export interface EducationProgramConfigurationAPIOutDTO {
  configurationId: number;
  programData: EducationProgramDataAPIOutDTO;
  visualSchema: unknown;
  validationSchema: unknown;
}

/**
 * Education program complete information.
 * Shared between the Ministry and the Institution.
 */
export interface EducationProgramAPIOutDTO extends EducationProgramConfigurationAPIOutDTO {
  id: number;
  // Program attributes persisted in dedicated columns, independent
  // of the dynamic program data shape defined by the configuration.
  // To be reduced in upcoming refactor to rely more on dynamic program data.
  name: string;
  description: string;
  programStatus: ProgramStatus;
  credentialType: string;
  credentialTypeToDisplay: string;
  cipCode: string;
  nocCode?: string;
  sabcCode?: string;
  institutionProgramCode?: string;
  programIntensity: ProgramIntensity;
  isActive: boolean;
  submittedDate: Date;
  submittedBy: string;
  assessedDate?: Date;
  assessedBy?: string;
  effectiveEndDate?: string;
  isExpired: boolean;
  institutionId: number;
  institutionName: string;
}

/**
 * Education program information to be displayed in a summary list.
 */
export interface EducationProgramsSummaryAPIOutDTO {
  programId: number;
  programName: string;
  cipCode: string;
  sabcCode?: string;
  credentialType: string;
  totalOfferings: number;
  credentialTypeToDisplay: string;
  submittedDate: Date;
  locationName: string;
  locationId: number;
  programStatus: ProgramStatus;
  isActive: boolean;
  isExpired: boolean;
}

/**
 * Dynamic program data used to create an education program,
 * and the configuration it was filled in against.
 */
export interface CreateEducationProgramAPIInDTO {
  /**
   * Program configuration ID against which the program is being created.
   */
  programConfigurationId: number;
  /**
   * Dynamic program data, whose shape is defined by the program
   * configuration schemas.
   */
  programData: Record<string, unknown>;
}

/**
 * Dynamic program data used to update an education program.
 */
export interface UpdateEducationProgramAPIInDTO {
  /**
   * Dynamic program data, whose shape is defined by the program
   * configuration schemas.
   */
  programData: Record<string, unknown>;
}

export interface StudentEducationProgramAPIOutDTO {
  id: number;
  name: string;
  description: string;
  credentialTypeToDisplay: string;
  credentialType: string;
  deliveryMethod: string;
}

export interface ApproveProgramAPIInDTO {
  effectiveEndDate: string;
  approvedNote: string;
}

export interface DeclineProgramAPIInDTO {
  declinedNote: string;
}

export interface DeactivateProgramAPIInDTO {
  note: string;
}

export interface EducationProgramPendingAPIOutDTO {
  id: number;
  programName: string;
  institutionOperatingName: string;
  submittedDate: Date;
  institutionId: number;
  selectedLocationId: number;
}

export interface ProgramEvaluationDataAPIInDTO {
  credentialType?: string;
  cipCode?: string;
}

export interface ProgramEvaluationAPIInDTO {
  /**
   * Program evaluation data.
   */
  data: ProgramEvaluationDataAPIInDTO;
  /**
   * Keys of the calculated data to be evaluated.
   */
  calculatedDataKeys: ProgramCalculatedDataKey[];
}

export interface ProgramEvaluationAPIOutDTO {
  calculatedData: ProgramEvaluationResult;
}
