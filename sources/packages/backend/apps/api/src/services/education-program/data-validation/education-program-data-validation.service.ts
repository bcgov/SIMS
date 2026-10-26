import { Injectable } from "@nestjs/common";
import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import {
  EducationProgramData,
  EducationProgramDynamicConfiguration,
} from "../education-program-save.models";
import {
  EducationProgramDataValidationResult,
  EducationProgramDataWithContext,
  ProgramTriggeredFlag,
} from "./education-program-data-validation.models";
import { ProgramCompiledFlag } from "./data-validation-schema-cache.models";
import { DataValidationSchemaCache } from "./data-validation-schema-cache.service";
import { EducationProgramDataValidationContext } from "./custom-validators/custom-validators.models";
import { UniqueSABCValidator } from "./custom-validators/unique-sabc-validator.service";

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
 * keywords (e.g. {@link UniqueSABCValidator}), which are ignored by the
 * client form since its validation must remain synchronous.
 */
@Injectable()
export class EducationProgramDataValidationService {
  private readonly ajv: Ajv;

  constructor(
    private readonly dataValidationSchemaCache: DataValidationSchemaCache,
    uniqueSABCValidator: UniqueSABCValidator,
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
    uniqueSABCValidator.addKeyword(this.ajv);
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
    const { validator, flags } = this.dataValidationSchemaCache.getValidator(
      this.ajv,
      configuration,
    );
    // Any context provided by the client is replaced by the server one.
    const data: EducationProgramDataWithContext = {
      ...programData,
      context: configuration.context,
    };
    // Any flags provided by the client are recalculated by the server.
    delete data.flags;
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
    const triggeredFlags = this.calculateFlags(flags, data);
    delete data.context;
    return { isValid: true, programData: data, flags: triggeredFlags };
  }

  /**
   * Calculates the flags, declared in the validation schema "x-flags"
   * keyword, triggered by the program data.
   * Must be kept aligned with the web createFlagsCalculator
   * (web/src/components/renderers/jsonforms/ajv.ts).
   * @param flags compiled flag conditions.
   * @param data program data, including its context.
   * @returns flags triggered by the data.
   */
  private calculateFlags(
    flags: ProgramCompiledFlag[],
    data: EducationProgramDataWithContext,
  ): ProgramTriggeredFlag[] {
    return flags
      .filter((flag) => flag.validate(data))
      .map(({ code, effect }) => ({ code, effect }));
  }

  /**
   * Gets the validation messages from the AJV errors, prefixed by the path
   * of the property that failed the validation (e.g. /cipCode must match pattern ...).
   * @param errors AJV validation errors.
   * @returns validation messages.
   */
  private getMessages(errors: Partial<ErrorObject>[]): string[] {
    // "if" errors only state that a "then" failed, which is already
    // reported by the "then" own error.
    return errors
      .filter((error) => error.keyword !== "if")
      .map((error) =>
        this.ajv
          .errorsText(
            [{ ...error, message: this.getMessage(error) } as ErrorObject],
            { dataVar: "" },
          )
          // Errors at the root (e.g. required) have an empty path, leaving a leading space.
          .trim(),
      );
  }

  /**
   * Gets the AJV error message, including the expected values for the
   * keywords whose default message does not include them.
   * @param error AJV validation error.
   * @returns validation message.
   */
  private getMessage(error: Partial<ErrorObject>): string {
    // Custom keywords errors may not have a message.
    const message = error.message ?? error.keyword;
    switch (error.keyword) {
      case "const":
        return `${message}: ${JSON.stringify(error.params?.allowedValue)}`;
      // A property set to the false schema is not allowed to be present.
      case "false schema":
        return "must not be present";
      case "enum":
        return `${message}: ${(error.params?.allowedValues as unknown[])
          ?.map((value) => JSON.stringify(value))
          .join(", ")}`;
      default:
        return message;
    }
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
}
