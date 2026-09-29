import { Injectable } from "@nestjs/common";
import Ajv, { ValidateFunction } from "ajv";
import addErrors from "ajv-errors";
import addFormats from "ajv-formats";
import { EducationProgramConfiguration } from "@sims/sims-db";
import {
  EducationProgramDataContext,
  EducationProgramDataValidationResult,
  EducationProgramDynamicData,
} from "./education-program.service.models";

/**
 * Validates the dynamic education program data against the validation schema
 * of its program configuration, the same schema used by the client form.
 * The AJV options and custom formats must be kept aligned with the web
 * programFormAjv (web/src/renderers/jsonforms/ajv.ts), otherwise the client
 * and the server could disagree about the data being valid.
 */
@Injectable()
export class EducationProgramDataValidationService {
  private readonly ajv: Ajv;
  /**
   * Compiled validators per configuration version, since compiling a schema is expensive.
   */
  private readonly validators = new Map<string, ValidateFunction>();

  constructor() {
    this.ajv = new Ajv({
      // Required by ajv-errors to replace every keyword error by its custom message.
      allErrors: true,
      strict: false,
      addUsedSchema: false,
      // Remove the properties not defined by the schema wherever it sets
      // "additionalProperties": false, so unknown properties are never persisted.
      removeAdditional: true,
    });
    addFormats(this.ajv);
    addErrors(this.ajv);
    // Not a data format, only a hint for the client to render a yes/no control.
    this.ajv.addFormat("yesNo", true);
  }

  /**
   * Validates the dynamic program data.
   * @param configuration program configuration providing the validation schema.
   * @param programData dynamic program data to be validated.
   * @param context server-built context the schema validations depend on.
   * @returns the program data without the context and the properties not
   * defined by the schema, when valid, otherwise the validation messages.
   */
  validate(
    configuration: Pick<
      EducationProgramConfiguration,
      "id" | "validationSchema" | "updatedAt"
    >,
    programData: EducationProgramDynamicData,
    context: EducationProgramDataContext,
  ): EducationProgramDataValidationResult {
    const validator = this.getValidator(configuration);
    // Any context provided by the client is replaced by the server one.
    const data: EducationProgramDynamicData = { ...programData, context };
    if (!validator(data)) {
      // "if" errors only state that a "then" failed, which is already
      // reported by the "then" own error.
      const messages = (validator.errors ?? [])
        .filter((error) => error.keyword !== "if")
        .map((error) => error.message ?? error.keyword);
      return { isValid: false, errors: [...new Set(messages)] };
    }
    delete data.context;
    return { isValid: true, programData: data };
  }

  /**
   * Gets the compiled validator for the configuration, compiling it when
   * not compiled yet or when the configuration was changed since then.
   * @param configuration program configuration providing the validation schema.
   * @returns compiled validator.
   */
  private getValidator(
    configuration: Pick<
      EducationProgramConfiguration,
      "id" | "validationSchema" | "updatedAt"
    >,
  ): ValidateFunction {
    const key = `${configuration.id}-${configuration.updatedAt?.getTime()}`;
    let validator = this.validators.get(key);
    if (!validator) {
      validator = this.ajv.compile(configuration.validationSchema as object);
      this.validators.set(key, validator);
    }
    return validator;
  }
}
