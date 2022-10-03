import { ValidationError } from "class-validator";

/**
 * Extract all error messages from all validation errors and its children.
 * @param errors errors to have all the messages extracted.
 * @returns all the messages in a single array.
 */
export function flattenErrorMessages(errors: ValidationError[]): string[] {
  const allErrors: string[] = [];
  errors.forEach((error) => {
    const flattenedErrors = flattenErrors(error);
    const flattenedConstraints = flattenedErrors.map(
      (error) => error.constraints,
    );
    const errorMessages = flattenedConstraints.flatMap((constraint) =>
      Object.values(constraint),
    );
    allErrors.push(...errorMessages);
  });
  return allErrors;
}

/**
 * Recursively get the errors and its children errors.
 * Consider errors only where a constraint object is defined.
 * The constraint object contains the list of errors in a
 * key-value pair model where the key is the error name and
 * the value is the error message.
 * an example of an constraint object would be as below:
 * @example
 * {
 *    someLengthValidator: "The property exceed the value.",
 *    isNotEmptyValidator: "The property is empty.",
 * }
 * @param error error.
 * @returns validation errors with constraints defined.
 */
export function flattenErrors(error: ValidationError) {
  const flattenedErrors: ValidationError[] = [];
  generateFlattenedErrors(error, flattenedErrors);
  return flattenedErrors;
}

/**
 * Recursively get the errors and its children errors.
 * Consider errors only where a constraint object is defined.
 * @param error error to start.
 * @param flattenedConstraints keeps the list of all
 * validation constraint objects which contains all the errors.
 */
function generateFlattenedErrors(
  error: ValidationError,
  flattenedConstraints: ValidationError[] = [],
) {
  if (error.constraints) {
    flattenedConstraints.push(error);
  }
  if (error.children) {
    error.children.forEach((childError) =>
      generateFlattenedErrors(childError, flattenedConstraints),
    );
  }
}
