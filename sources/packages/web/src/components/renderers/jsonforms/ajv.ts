import Ajv from "ajv";
import type { ErrorObject } from "ajv";
import { isControl, isLayout, toDataPath } from "@jsonforms/core";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
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
 *
 * The options affecting the data validity (e.g. strict), the custom formats
 * and the ajv/ajv-formats versions must be kept aligned with the backend
 * EducationProgramDataValidationService, otherwise the client and the server
 * could disagree about the data being valid.
 */
export const programFormAjv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
  addUsedSchema: false,
  // Not a data format, only a hint consumed by yesNoControlTester to route
  // the control to RadioOptionsYesNo. Registered as always valid to avoid
  // Ajv's "unknown format ... ignored" warning.
  formats: { yesNo: true },
});
addFormats(programFormAjv);
addErrors(programFormAjv);

/**
 * Effect of a triggered flag on the program, besides any UI banner
 * displayed for it. Only applied by the server.
 * Must be kept aligned with the server ProgramFlagEffect.
 */
export enum ProgramFlagEffect {
  /**
   * The program must be reviewed by the Ministry, hence it is saved as pending.
   */
  PendingReview = "pendingReview",
}

/**
 * Flag triggered by the program data.
 * Must be kept aligned with the server ProgramTriggeredFlag.
 */
export interface ProgramTriggeredFlag {
  code: string;
  effect?: ProgramFlagEffect;
}

/**
 * Flag declared in the validation schema "x-flags" keyword. It doesn't
 * make the data invalid, it is only triggered when the data matches its condition.
 */
interface SchemaFlag {
  code: string;
  message: string;
  /**
   * Effect on the program when triggered.
   */
  effect?: ProgramFlagEffect;
  condition: object;
}

/**
 * Creates a function to calculate the flags, declared in the validation
 * schema "x-flags" keyword, triggered by the form data. Each flag
 * condition is compiled only once per schema, since compiling is expensive.
 * Must be kept aligned with the server calculateFlags
 * (backend EducationProgramDataValidationService), so both produce the same flags.
 * @param schema validation schema declaring the flags.
 * @returns function returning the flags triggered by the data.
 */
export function createFlagsCalculator(
  schema: JsonSchema,
): (data: unknown) => ProgramTriggeredFlag[] {
  const flags = ((schema as Record<string, unknown>)["x-flags"] ??
    []) as SchemaFlag[];
  const conditions = flags.map((flag) => ({
    code: flag.code,
    effect: flag.effect,
    validate: programFormAjv.compile(flag.condition),
  }));
  return (data) =>
    conditions
      .filter((condition) => condition.validate(data))
      .map(({ code, effect }) => ({ code, effect }));
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

/**
 * Gets the data paths of the controls in the order they are displayed,
 * e.g. "/programName" for the scope "#/properties/programName".
 * Rule condition scopes are ignored, since they are not displayed.
 * @param uischema UI schema to be traversed.
 * @returns data paths of the controls, in display order.
 */
function getControlPaths(uischema: UISchemaElement): string[] {
  if (isControl(uischema)) {
    const dataPath = toDataPath(uischema.scope);
    return [`/${dataPath.replaceAll(".", "/")}`];
  }
  if (isLayout(uischema)) {
    return uischema.elements.flatMap(getControlPaths);
  }
  return [];
}

/**
 * Gets the data path of the property an error refers to. A custom "required"
 * message is reported on the parent object (see getRequiredErrorsPerProperty),
 * hence the missing property is appended to the parent path.
 * @param error validation error.
 * @returns data path of the property, e.g. "/programName".
 */
function getErrorPropertyPath(error: ErrorObject): string {
  if (error.keyword === "errorMessage") {
    const originalErrors = (error.params.errors ?? []) as ErrorObject[];
    const requiredError = originalErrors.find(
      (originalError) => originalError.keyword === "required",
    );
    if (requiredError) {
      return `${error.instancePath}/${requiredError.params.missingProperty}`;
    }
  }
  return error.instancePath;
}

/**
 * Sorts the validation errors in the order their controls are displayed
 * by the UI schema, since AJV reports them in the schema evaluation order.
 * An error is matched to the control with the longest path containing it,
 * e.g. "/entranceRequirements/0" to the "/entranceRequirements" control.
 * Errors not matching any control are kept, in their original order, at the end.
 * @param errors validation errors reported by JSONForms.
 * @param uischema UI schema displaying the controls.
 * @returns errors sorted by display order.
 */
export function sortErrorsByUISchema(
  errors: ErrorObject[],
  uischema: UISchemaElement,
): ErrorObject[] {
  const controlPaths = getControlPaths(uischema);
  const getDisplayIndex = (error: ErrorObject): number => {
    const errorPath = getErrorPropertyPath(error);
    let displayIndex = controlPaths.length;
    let matchedPathLength = -1;
    controlPaths.forEach((controlPath, index) => {
      const isMatch =
        errorPath === controlPath || errorPath.startsWith(`${controlPath}/`);
      if (isMatch && controlPath.length > matchedPathLength) {
        displayIndex = index;
        matchedPathLength = controlPath.length;
      }
    });
    return displayIndex;
  };
  // Array sort is stable, keeping the original order for the same index.
  return errors
    .map((error) => ({ error, displayIndex: getDisplayIndex(error) }))
    .sort((a, b) => a.displayIndex - b.displayIndex)
    .map(({ error }) => error);
}
