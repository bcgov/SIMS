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
  /**
   * Indicates if full update of the program is restricted.
   * When true, only partial updates to the program are allowed.
   * For instance, if the program has offerings, only certain fields may be updated.
   */
  isFullUpdateRestricted: boolean;
  /**
   * Is considered a private institution in British Columbia.
   */
  isBCPrivate: boolean;
  /**
   * Is considered an Institution in British Columbia,
   * for instance a public or private institution in British Columbia.
   */
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

/**
 * Education program configuration including context,
 * visual schema, and validation schema.
 */
export interface EducationProgramConfigurationAPIOutDTO {
  configurationId: number;
  programYearName: string;
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
 * Education program configuration for a specific program year.
 * Allow retrieving the list of program years where at least one program configuration exists.
 */
export class EducationProgramYearAPIOutDTO {
  /**
   * ID of the program year.
   */
  id: number;
  /**
   * Description of the program year.
   */
  description: string;
  /**
   * Indicates if there is at least one active program configuration for this program year.
   * This would be an indication that and eduction program can potentially be created or
   * changed in this program year.
   */
  hasActiveProgramConfiguration: boolean;
}

/**
 * Renewal status of an education program into the next program year.
 * Calculated status used at DTO level for API responses.
 */
export enum ProgramRenewalStatus {
  /**
   * Program was already renewed into the next program year.
   */
  Renewed = "Renewed",
  /**
   * Program is not renewed yet and a next program configuration is available for the renewal.
   */
  Available = "Available",
  /**
   * Program is not renewed yet and there is no next program configuration available for the renewal.
   * It can happen for a newly created program year that has not yet been configured for the next program year
   * or for an education program year that has reached the end of its lifecycle and it was marked as inactive.
   */
  NotAvailable = "Not available",
}

/**
 * Education program summary details for management purposes.
 */
export class EducationProgramManagerDetailsAPIOutDTO {
  id: number;
  name: string;
  credentialTypeToDisplay: string;
  cipCode: string;
  sabcCode?: string;
  programStatus: ProgramStatus;
  isActive: boolean;
  isExpired: boolean;
  /**
   * Renewal status of the education program into the next program year.
   * All programs are available for renewal into the next program year,
   * independently of their current status or being active.
   */
  renewalStatus: ProgramRenewalStatus;
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
