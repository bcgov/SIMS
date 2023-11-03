import { ValidationError } from "class-validator";
import { ValidationContext, ValidationContextTypes } from "../../services";

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

/**
 * Inspect the validation error and its children checking when an error
 * happen as has an additional context (must be considered a warning or a info)
 * or it is a critical error (has no warning or info context).
 * @param error error to be inspected.
 * @returns errors, warnings and infos.
 */
export function extractValidationsByType<T, S>(
  error: ValidationError,
): {
  errors: string[];
  warnings: ValidationResult<T>[];
  infos: ValidationResult<S>[];
} {
  const errors: string[] = [];
  const warnings: ValidationResult<T>[] = [];
  const infos: ValidationResult<S>[] = [];
  const flattenedErrors = flattenErrors(error);
  flattenedErrors.forEach((error) => {
    Object.keys(error.constraints).forEach((errorConstraintKey) => {
      let associatedContext: ValidationContext = undefined;
      if (error.contexts) {
        associatedContext = error.contexts[
          errorConstraintKey
        ] as ValidationContext;
      }
      const errorDescription = error.constraints[errorConstraintKey];
      if (associatedContext?.type === ValidationContextTypes.Warning) {
        warnings.push({
          typeCode: associatedContext.typeCode as T,
          message: errorDescription,
        });
      } else if (
        associatedContext?.type === ValidationContextTypes.Information
      ) {
        infos.push({
          typeCode: associatedContext.typeCode as S,
          message: errorDescription,
        });
      } else {
        errors.push(errorDescription);
      }
    });
  });
  return { errors, warnings, infos };
}

/**
 * Validation warnings and infos with a unique typecode and
 * a user-friendly message to be displayed.
 */
export interface ValidationResult<T> {
  typeCode: T;
  message: string;
}
