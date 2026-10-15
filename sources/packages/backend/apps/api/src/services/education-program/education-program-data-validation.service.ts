import { Injectable } from "@nestjs/common";
import Ajv, { AnySchemaObject, ValidateFunction } from "ajv";
import addErrors from "ajv-errors";
import addFormats from "ajv-formats";
import {
  EducationProgramData,
  EducationProgramDynamicConfiguration,
} from "./education-program-save.models";
import {
  EducationProgramDataValidationResult,
  EducationProgramDataWithContext,
  ProgramCompiledValidator,
} from "./education-program-data-validation.models";

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
   * Compiled validator of the latest known version of each configuration, since
   * compiling a schema is expensive. AJV caches compiled schemas by object reference
   * only, and the schema is loaded from the DB on every request as a new object,
   * hence the AJV cache alone would recompile on every call and grow indefinitely.
   */
  private readonly validators = new Map<number, ProgramCompiledValidator>();

  constructor() {
    this.ajv = new Ajv({
      // Required by ajv-errors to replace every keyword error by its custom message.
      allErrors: true,
      strict: false,
      addUsedSchema: false,
      // Remove the properties not defined by the schema wherever it sets
      // "additionalProperties": false, so unknown properties are never persisted.
      removeAdditional: true,
      // Not a data format, only a hint for the client to render a yes/no control.
      formats: { yesNo: true },
    });
    addFormats(this.ajv);
    addErrors(this.ajv);
  }

  /**
   * Validates the dynamic program data.
   * @param configuration program configuration providing the validation schema.
   * @param programData dynamic program data to be validated.
   * @returns the program data without the context and the properties not
   * defined by the schema, when valid, otherwise the validation messages.
   */
  validate(
    configuration: EducationProgramDynamicConfiguration,
    programData: EducationProgramData,
  ): EducationProgramDataValidationResult {
    const validator = this.getValidator(configuration);
    // Any context provided by the client is replaced by the server one.
    const data: EducationProgramDataWithContext = {
      ...programData,
      context: configuration.context,
    };
    // Warnings are calculated by the client only to show the warning banners.
    delete data.warnings;
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
   * The validator of a previous version of the configuration is discarded,
   * also from the AJV cache, to keep only one validator per configuration.
   * @param configuration program configuration providing the validation schema.
   * @returns compiled validator.
   */
  private getValidator(
    configuration: EducationProgramDynamicConfiguration,
  ): ValidateFunction {
    if (!configuration.updatedAt) {
      // Without the version, a validator compiled from an outdated schema could be used.
      throw new Error(
        `The updatedAt of the program configuration ${configuration.configurationId} is required to get its validator.`,
      );
    }
    const updatedAt = configuration.updatedAt.getTime();
    const cached = this.validators.get(configuration.configurationId);
    if (cached?.updatedAt === updatedAt) {
      return cached.validator;
    }
    if (cached) {
      this.ajv.removeSchema(cached.schema);
    }
    const schema = configuration.validationSchema as AnySchemaObject;
    const validator = this.ajv.compile(schema);
    this.validators.set(configuration.configurationId, {
      updatedAt,
      schema,
      validator,
    });
    return validator;
  }
}
