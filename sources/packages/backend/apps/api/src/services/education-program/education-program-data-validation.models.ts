import { AnySchemaObject, ValidateFunction } from "ajv";
import {
  EducationProgramContext,
  EducationProgramData,
} from "./education-program-save.models";

/**
 * Result of the dynamic program data validation.
 */
export type EducationProgramDataValidationResult =
  | { isValid: true; programData: EducationProgramData; warnings: string[] }
  | { isValid: false; errors: string[] };

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
  schema: AnySchemaObject;
  validator: ValidateFunction;
  /**
   * Warning conditions declared in the schema "x-warnings" keyword.
   */
  warnings: ProgramCompiledWarning[];
}
