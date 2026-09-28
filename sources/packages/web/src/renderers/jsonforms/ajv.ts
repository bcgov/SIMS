import Ajv from "ajv";
import type { ErrorObject } from "ajv";
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
