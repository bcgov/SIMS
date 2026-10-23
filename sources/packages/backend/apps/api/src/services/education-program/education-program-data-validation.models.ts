import {
  AnySchemaObject,
  AsyncSchema,
  AsyncValidateFunction,
  ValidateFunction,
} from "ajv";
import {
  EducationProgramContext,
  EducationProgramData,
} from "./education-program-save.models";

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
 * Server-side information required by the backend-only validations,
 * provided to the AJV custom keywords as the validation context (passContext).
 */
export interface EducationProgramDataValidationContext {
  /**
   * Institution the program belongs to.
   */
  institutionId: number;
  /**
   * Program year the program belongs to.
   */
  programYearId: number;
  /**
   * Program being updated, not present when the program is being created.
   */
  programId?: number;
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
 * Flag declared in the validation schema "x-flags" keyword. It doesn't
 * make the data invalid, it is only triggered when the data matches its condition.
 */
export interface ProgramSchemaFlag {
  code: string;
  message: string;
  /**
   * Effect on the program when triggered. Without an effect, the flag
   * is only used by the UI (e.g. to display a banner).
   */
  effect?: ProgramFlagEffect;
  condition: AnySchemaObject;
}

/**
 * Flag condition compiled from a program configuration validation schema.
 */
export interface ProgramCompiledFlag {
  code: string;
  effect?: ProgramFlagEffect;
  /**
   * Condition compiled, kept to remove it from the AJV cache once outdated.
   */
  condition: AnySchemaObject;
  validate: ValidateFunction;
}

/**
 * Flag triggered by the program data.
 */
export interface ProgramTriggeredFlag {
  code: string;
  effect?: ProgramFlagEffect;
}

/**
 * Validator compiled from a specific version of a program configuration.
 */
export interface ProgramCompiledValidator {
  /**
   * Version of the configuration the validator was compiled from.
   */
  updatedAt: number;
  /**
   * Schema compiled, kept to remove it from the AJV cache once outdated.
   */
  schema: AsyncSchema;
  validator: AsyncValidateFunction;
  /**
   * Flag conditions declared in the schema "x-flags" keyword.
   */
  flags: ProgramCompiledFlag[];
}

/**
 * AJV custom async keyword ensuring the SABC code is not used by another
 * active program of the same institution for the same program year.
 * Declared in the configuration validation schema, which is shared with the
 * client form, where it is ignored since it depends on server-side information.
 */
export const SABC_CODE_UNIQUE_KEYWORD = "sabcCodeUnique";
