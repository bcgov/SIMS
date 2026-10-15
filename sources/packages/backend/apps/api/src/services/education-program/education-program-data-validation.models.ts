import { AnySchemaObject, ValidateFunction } from "ajv";
import {
  EducationProgramContext,
  EducationProgramData,
} from "./education-program-save.models";

/**
 * Result of the dynamic program data validation.
 */
export type EducationProgramDataValidationResult =
  | { isValid: true; programData: EducationProgramData }
  | { isValid: false; errors: string[] };

export interface EducationProgramDataWithContext extends EducationProgramData {
  context: EducationProgramContext;
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
}
