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
  warnings: string[];
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
 * Warning declared in the validation schema "x-warnings" keyword. It doesn't
 * make the data invalid, it is only triggered when the data matches its condition.
 */
export interface ProgramSchemaWarning {
  code: string;
  message: string;
  condition: AnySchemaObject;
}

/**
 * Warning condition compiled from a program configuration validation schema.
 */
export interface ProgramCompiledWarning {
  code: string;
  /**
   * Condition compiled, kept to remove it from the AJV cache once outdated.
   */
  condition: AnySchemaObject;
  validate: ValidateFunction;
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
   * Warning conditions declared in the schema "x-warnings" keyword.
   */
  warnings: ProgramCompiledWarning[];
}

/**
 * AJV custom async keyword ensuring the SABC code is not used by another
 * active program of the same institution for the same program year.
 * Declared in the configuration validation schema, which is shared with the
 * client form, where it is ignored since it depends on server-side information.
 */
export const SABC_CODE_UNIQUE_KEYWORD = "sabcCodeUnique";
