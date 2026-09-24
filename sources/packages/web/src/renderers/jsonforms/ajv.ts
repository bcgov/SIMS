import Ajv from "ajv";
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
