import {
  EducationProgramContext,
  EducationProgramData,
} from "../education-program-save.models";

/**
 * Successful validation result for the program data.
 */
export type EducationProgramDataValidationSuccess = {
  isValid: true;
  programData: EducationProgramData;
  flags: ProgramTriggeredFlag[];
};

/**
 * Failed validation result for the program data.
 */
export type EducationProgramDataValidationError = {
  isValid: false;
  errors: string[];
  /**
   * Keywords that failed the validation, allowing a specific failure
   * (e.g. {@link SABC_CODE_UNIQUE_KEYWORD}) to be detected regardless
   * of its custom message.
   */
  failedKeywords: string[];
};

/**
 * Result of the dynamic program data validation.
 */
export type EducationProgramDataValidationResult =
  EducationProgramDataValidationSuccess | EducationProgramDataValidationError;

/**
 * Program data with the associated context for validation purposes.
 */
export interface EducationProgramDataWithContext extends EducationProgramData {
  context: EducationProgramContext;
}

/**
 * Effect of a triggered flag on the program, besides any UI banner
 * displayed for it.
 */
export enum ProgramFlagEffect {
  /**
   * The program must be reviewed by the Ministry, hence it is saved as pending.
   */
  PendingReview = "pendingReview",
}

/**
 * Flag triggered by the program data.
 */
export interface ProgramTriggeredFlag {
  code: string;
  effect?: ProgramFlagEffect;
}

/**
 * AJV custom async keyword ensuring the SABC code is not used by another
 * active program of the same institution for the same program year.
 * Declared in the configuration validation schema, which is shared with the
 * client form, where it is ignored since it depends on server-side information.
 */
export const SABC_CODE_UNIQUE_KEYWORD = "sabcCodeUnique";
