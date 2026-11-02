import { Injectable } from "@nestjs/common";
import Ajv, { AnySchemaObject, AsyncSchema } from "ajv";
import { EducationProgramDynamicConfiguration } from "../education-program-save.models";
import {
  ProgramCompiledValidator,
  ProgramSchemaFlag,
} from "./data-validation-schema-cache.models";

/**
 * Keeps the compiled validator of the latest known version of each program
 * configuration, since compiling a schema is expensive. AJV caches compiled
 * schemas by object reference only, and the schema is loaded from the DB on
 * every request as a new object, hence the AJV cache alone would recompile
 * on every call and grow indefinitely.
 */
@Injectable()
export class DataValidationSchemaCache {
  private readonly validators = new Map<number, ProgramCompiledValidator>();

  /**
   * Gets the compiled validator for the configuration, compiling it when
   * not compiled yet or when the configuration was changed since then.
   * The validator of a previous version of the configuration is discarded,
   * also from the AJV cache, to keep only one validator per configuration.
   * @param ajv AJV instance used to compile the schemas. Must be the same
   * instance on every call, since the outdated schemas are removed from its cache.
   * @param configuration program configuration providing the validation schema.
   * @returns compiled validator and flag conditions.
   */
  getValidator(
    ajv: Ajv,
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
      ajv.removeSchema(cached.schema);
      cached.flags.forEach((flag) => ajv.removeSchema(flag.condition));
    }
    // The configuration schema is shared with the client form, hence it is not
    // declared as async, which is required to use async keywords.
    const schema: AsyncSchema = {
      ...(configuration.validationSchema as AnySchemaObject),
      $async: true,
    };
    const schemaFlags = (schema["x-flags"] ?? []) as ProgramSchemaFlag[];
    const compiledValidator: ProgramCompiledValidator = {
      updatedAt,
      schema,
      validator: ajv.compile(schema),
      flags: schemaFlags.map((flag) => ({
        code: flag.code,
        effect: flag.effect,
        condition: flag.condition,
        validate: ajv.compile(flag.condition),
      })),
    };
    this.validators.set(configuration.configurationId, compiledValidator);
    return compiledValidator;
  }
}
