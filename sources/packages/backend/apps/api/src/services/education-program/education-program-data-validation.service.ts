import { Injectable } from "@nestjs/common";
import Ajv, {
  AnySchemaObject,
  AsyncSchema,
  AsyncValidateFunction,
  ErrorObject,
  ValidateFunction,
} from "ajv";
import addErrors from "ajv-errors";
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
} from "./education-program-data-validation.models";
import { EducationProgramService } from "./education-program.service";

/**
 * AJV custom async keyword ensuring the SABC code is not used by another
 * active program of the same institution.
 */
const SABC_CODE_UNIQUE_KEYWORD = "sabcCodeUnique";

/**
 * Validations executed only by the backend, since they depend on server-side
 * information (e.g. DB queries). Kept apart from the configuration validation
 * schema, which is shared with the client form and must remain synchronous.
 */
const BACKEND_VALIDATION_SCHEMA: AsyncSchema = {
  $async: true,
  type: "object",
  properties: {
    sabcCode: {
      [SABC_CODE_UNIQUE_KEYWORD]: true,
      errorMessage: {
        [SABC_CODE_UNIQUE_KEYWORD]:
          "SABC program code is already in use by another active program.",
      },
    },
  },
};

/**
 * Validates the dynamic education program data against the validation schema
 * of its program configuration, the same schema used by the client form.
 * The AJV options and custom formats must be kept aligned with the web
 * programFormAjv (web/src/renderers/jsonforms/ajv.ts), otherwise the client
 * and the server could disagree about the data being valid.
 * Additionally, validates the data against the backend-only validations.
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
  /**
   * Compiled validator of the backend-only validations.
   */
  private readonly backendValidator: AsyncValidateFunction;

  constructor(
    private readonly educationProgramService: EducationProgramService,
  ) {
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
      // Allows the custom keywords to access the validation context as "this".
      passContext: true,
    });
    addFormats(this.ajv);
    addErrors(this.ajv);
    this.addSABCCodeUniqueKeyword();
    this.backendValidator = this.ajv.compile(BACKEND_VALIDATION_SCHEMA);
  }

  /**
   * Validates the dynamic program data.
   * @param configuration program configuration providing the validation schema.
   * @param programData dynamic program data to be validated.
   * @param validationContext server-side information required by the backend-only validations.
   * @returns the program data without the context and the properties not
   * defined by the schema, when valid, otherwise the validation messages.
   */
  async validate(
    configuration: EducationProgramDynamicConfiguration,
    programData: EducationProgramData,
    validationContext: EducationProgramDataValidationContext,
  ): Promise<EducationProgramDataValidationResult> {
    const validator = this.getValidator(configuration);
    // Any context provided by the client is replaced by the server one.
    const data: EducationProgramDataWithContext = {
      ...programData,
      context: configuration.context,
    };
    // Warnings are calculated by the client only to show the warning banners.
    delete data.warnings;
    const messages = validator(data) ? [] : this.getMessages(validator.errors);
    try {
      await this.backendValidator.call(validationContext, data);
    } catch (error: unknown) {
      if (!(error instanceof Ajv.ValidationError)) {
        throw error;
      }
      messages.push(...this.getMessages(error.errors));
    }
    if (messages.length) {
      return { isValid: false, errors: [...new Set(messages)] };
    }
    delete data.context;
    return { isValid: true, programData: data };
  }

  /**
   * Gets the validation messages from the AJV errors.
   * @param errors AJV validation errors.
   * @returns validation messages.
   */
  private getMessages(errors?: Partial<ErrorObject>[] | null): string[] {
    // "if" errors only state that a "then" failed, which is already
    // reported by the "then" own error.
    return (errors ?? [])
      .filter((error) => error.keyword !== "if")
      .map((error) => error.message ?? error.keyword);
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
            this.programId,
          );
        return !isDuplicate;
      },
    });
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
