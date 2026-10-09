import Ajv from "ajv";
import type { ErrorObject } from "ajv";
import type { JsonSchema } from "@jsonforms/core";
import addFormats from "ajv-formats";
import addErrors from "ajv-errors";

/**
 * A custom Ajv instance, mirroring @jsonforms/core's own default
 * (see createAjv in ajv/util/validator.ts) plus ajv-errors, which lets the
 * schema attach a human-readable "errorMessage" per keyword/property
 * instead of AJV's generic "must have required property 'x'" text.
 *
 * ajv-errors requires allErrors: true to reliably override every keyword's
 * message, which JSONForms' own default instance already sets - kept here
 * for parity.
 */
export const programFormAjv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
  addUsedSchema: false,
});
addFormats(programFormAjv);
addErrors(programFormAjv);

/**
 * "yesNo" is not a real data format, only a hint consumed by
 * yesNoControlTester to route the control to RadioOptionsYesNo. Registering
 * it as an always-valid format avoids Ajv's "unknown format ... ignored"
 * warning.
 */
programFormAjv.addFormat("yesNo", true);

/**
 * Warning declared in the validation schema "x-warnings" keyword. It doesn't
 * make the data invalid, it is only triggered when the data matches its condition.
 */
interface SchemaWarning {
  code: string;
  message: string;
  condition: object;
}

/**
 * Creates a function to calculate the warnings, declared in the validation
 * schema "x-warnings" keyword, triggered by the form data. Each warning
 * condition is compiled only once per schema, since compiling is expensive.
 * @param schema validation schema declaring the warnings.
 * @returns function returning the codes of the warnings triggered by the data.
 */
export function createWarningsCalculator(
  schema: JsonSchema,
): (data: unknown) => string[] {
  const warnings = ((schema as Record<string, unknown>)["x-warnings"] ??
    []) as SchemaWarning[];
  const conditions = warnings.map((warning) => ({
    code: warning.code,
    validate: programFormAjv.compile(warning.condition),
  }));
  return (data) =>
    conditions
      .filter((condition) => condition.validate(data))
      .map((condition) => condition.code);
}

/**
 * ajv-errors reports a custom "required" message as an "errorMessage" error
 * on the parent object (e.g. instancePath "" for a root property), which
 * JSONForms can't map to a control: its getControlPath only reads the missing
 * property from errors whose keyword is "required". Each such message is
 * re-pointed at the missing property, so it can be supplied to JSONForms as
 * "additionalErrors" and displayed by that property's control.
 * @param errors validation errors reported by JSONForms.
 * @returns one error per missing property, at the property path.
 */
export function getRequiredErrorsPerProperty(
  errors: ErrorObject[] = [],
): ErrorObject[] {
  return errors.flatMap((error) => {
    if (error.keyword !== "errorMessage") {
      return [];
    }
    const originalErrors = (error.params.errors ?? []) as ErrorObject[];
    return originalErrors
      .filter((originalError) => originalError.keyword === "required")
      .map((originalError) => ({
        ...error,
        instancePath: `${error.instancePath}/${originalError.params.missingProperty}`,
      }));
  });
}
