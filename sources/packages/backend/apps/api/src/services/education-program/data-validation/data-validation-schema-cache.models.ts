import {
  AnySchemaObject,
  AsyncSchema,
  AsyncValidateFunction,
  ValidateFunction,
} from "ajv";
import { ProgramFlagEffect } from "./education-program-data-validation.models";

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
