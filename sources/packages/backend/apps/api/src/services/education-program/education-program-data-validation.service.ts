import { Injectable } from "@nestjs/common";
import Ajv, { AnySchemaObject, AsyncSchema, ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import {
  EducationProgramData,
  EducationProgramDynamicConfiguration,
} from "./education-program-save.models";
import {
  EducationProgramDataValidationContext,
  EducationProgramDataValidationResult,
  EducationProgramDataWithContext,
  ProgramCompiledValidator,
  ProgramCompiledWarning,
  ProgramSchemaWarning,
  SABC_CODE_UNIQUE_KEYWORD,
} from "./education-program-data-validation.models";
import { EducationProgramService } from "./education-program.service";

/**
 * Validates the dynamic education program data against the validation schema
 * of its program configuration, the same schema used by the client form.
 * The AJV options affecting the data validity (e.g. strict) and the custom
 * formats must be kept aligned with the web programFormAjv
 * (web/src/components/renderers/jsonforms/ajv.ts), otherwise the client and
 * the server could disagree about the data being valid.
 * Differently from the client, the server stops at the first error
 * (allErrors: false) and does not use ajv-errors, since the validation
 * messages are not displayed to the user, hence the schema "errorMessage"
 * keyword is ignored and the AJV default messages are reported.
 * The schema is compiled as async, allowing it to declare backend-only async
 * keywords (e.g. {@link SABC_CODE_UNIQUE_KEYWORD}), which are ignored by the
 * client form since its validation must remain synchronous.
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

  constructor(
    private readonly educationProgramService: EducationProgramService,
  ) {
    this.ajv = new Ajv({
      // Stops at the first error, avoiding evaluating the remaining keywords,
      // including the async ones querying the DB, once the data is known to be invalid.
      // Stops at the first error, following security recommendations to avoid DoS attacks.
      allErrors: false,
      strict: false,
      addUsedSchema: false,
      // Remove the properties not defined by the schema wherever it sets
      // "additionalProperties": false, so unknown properties are never persisted.
      removeAdditional: true,
      // Not a data format, only a hint for the client to render a yes/no control.
      formats: { yesNo: true },
      // Allows the custom keywords to access the validation context as "this".
      passContext: true,
    });
    addFormats(this.ajv);
    this.addSABCCodeUniqueKeyword();
  }

  /**
   * Validates the dynamic program data.
   * @param configuration program configuration providing the validation schema.
   * @param programData dynamic program data to be validated.
   * @param validationContext server-side information required by the backend-only keywords.
   * @returns the program data without the context and the properties not
   * defined by the schema, when valid, otherwise the validation messages.
   */
  async validate(
    configuration: EducationProgramDynamicConfiguration,
    programData: EducationProgramData,
    validationContext: EducationProgramDataValidationContext,
  ): Promise<EducationProgramDataValidationResult> {
    const { validator, warnings } = this.getValidator(configuration);
    // Any context provided by the client is replaced by the server one.
    const data: EducationProgramDataWithContext = {
      ...programData,
      context: configuration.context,
    };
    // Any warnings provided by the client are recalculated by the server.
    delete data.warnings;
    let errors: Partial<ErrorObject>[] = [];
    try {
      // An async validator throws, instead of returning false, when the data is invalid.
      await validator.call(validationContext, data);
    } catch (error: unknown) {
      if (!(error instanceof Ajv.ValidationError)) {
        throw error;
      }
      errors = error.errors;
    }
    if (errors.length) {
      return {
        isValid: false,
        errors: [...new Set(this.getMessages(errors))],
        failedKeywords: this.getFailedKeywords(errors),
      };
    }
    // Calculated with the context, the same way the client does.
    const triggeredWarnings = this.calculateWarnings(warnings, data);
    delete data.context;
    return { isValid: true, programData: data, warnings: triggeredWarnings };
  }

  /**
   * Calculates the warnings, declared in the validation schema "x-warnings"
   * keyword, triggered by the program data.
   * Must be kept aligned with the web createWarningsCalculator
   * (web/src/components/renderers/jsonforms/ajv.ts).
   * @param warnings compiled warning conditions.
   * @param data program data, including its context.
   * @returns codes of the warnings triggered by the data.
   */
  private calculateWarnings(
    warnings: ProgramCompiledWarning[],
    data: EducationProgramDataWithContext,
  ): string[] {
    return warnings
      .filter((warning) => warning.validate(data))
      .map((warning) => warning.code);
  }

  /**
   * Gets the validation messages from the AJV errors.
   * @param errors AJV validation errors.
   * @returns validation messages.
   */
  private getMessages(errors: Partial<ErrorObject>[]): string[] {
    // "if" errors only state that a "then" failed, which is already
    // reported by the "then" own error.
    return errors
      .filter((error) => error.keyword !== "if")
      .map((error) => error.message ?? error.keyword);
  }

  /**
   * Gets the keywords that failed the validation.
   * @param errors AJV validation errors.
   * @returns distinct failed keywords.
   */
  private getFailedKeywords(errors: Partial<ErrorObject>[]): string[] {
    const keywords = errors.map((error) => error.keyword);
    return [...new Set(keywords.filter((keyword) => !!keyword))];
  }

  /**
   * Adds the async keyword that ensures the SABC code is not used by another
   * active program of the same institution, expecting the
   * {@link EducationProgramDataValidationContext} as the validation context.
   */
  private addSABCCodeUniqueKeyword(): void {
    const educationProgramService = this.educationProgramService;
    this.ajv.addKeyword({
      keyword: SABC_CODE_UNIQUE_KEYWORD,
      async: true,
      type: "string",
      schemaType: "boolean",
      validate: async function (
        this: EducationProgramDataValidationContext,
        shouldValidate: boolean,
        sabcCode: string,
      ): Promise<boolean> {
        // Empty SABC codes are saved as null and can be shared between programs.
        if (!shouldValidate || !sabcCode.trim()) {
          return true;
        }
        const isDuplicate =
          await educationProgramService.hasExistingProgramWithSameSABCCode(
            this.institutionId,
            sabcCode.trim(),
            this.programYearId,
            this.programId,
          );
        if (isDuplicate) {
          throw new Ajv.ValidationError([
            { keyword: SABC_CODE_UNIQUE_KEYWORD },
          ]);
        }
        return true;
      },
    });
  }

  /**
   * Gets the compiled validator for the configuration, compiling it when
   * not compiled yet or when the configuration was changed since then.
   * The validator of a previous version of the configuration is discarded,
   * also from the AJV cache, to keep only one validator per configuration.
   * @param configuration program configuration providing the validation schema.
   * @returns compiled validator and warning conditions.
   */
  private getValidator(
    configuration: EducationProgramDynamicConfiguration,
  ): ProgramCompiledValidator {
    if (!configuration.updatedAt) {
      // Without the version, a validator compiled from an outdated schema could be used.
      throw new Error(
        `The updatedAt of the program configuration ${configuration.configurationId} is required to get its validator.`,
      );
    }
    const updatedAt = configuration.updatedAt.getTime();
    const cached = this.validators.get(configuration.configurationId);
    if (cached?.updatedAt === updatedAt) {
      return cached;
    }
    if (cached) {
      this.ajv.removeSchema(cached.schema);
      cached.warnings.forEach((warning) =>
        this.ajv.removeSchema(warning.condition),
      );
    }
    // The configuration schema is shared with the client form, hence it is not
    // declared as async, which is required to use async keywords.
    const schema: AsyncSchema = {
      ...(configuration.validationSchema as AnySchemaObject),
      $async: true,
    };
    const schemaWarnings = (schema["x-warnings"] ??
      []) as ProgramSchemaWarning[];
    const compiledValidator: ProgramCompiledValidator = {
      updatedAt,
      schema,
      validator: this.ajv.compile(schema),
      warnings: schemaWarnings.map((warning) => ({
        code: warning.code,
        condition: warning.condition,
        validate: this.ajv.compile(warning.condition),
      })),
    };
    this.validators.set(configuration.configurationId, compiledValidator);
    return compiledValidator;
  }
}
