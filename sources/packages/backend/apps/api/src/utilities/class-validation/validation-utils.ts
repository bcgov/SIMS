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

/**
 * Inspect the validation error and its children checking when an error
 * happen as has an additional context (must be considered a warning or a info)
 * or it is a critical error (has no warning or info context).
 * @param error error to be inspected.
 * @returns errors, warnings and infos.
 */
export function extractValidationsByType(error: ValidationError): {
  errors: string[];
  warnings: ValidationResult[];
  infos: ValidationResult[];
} {
  const errors: string[] = [];
  const warnings: ValidationResult[] = [];
  const infos: ValidationResult[] = [];
  const flattenedErrors = flattenErrors(error);
  flattenedErrors.forEach((error) => {
    Object.keys(error.constraints).forEach((errorConstraintKey) => {
      let associatedContext: ValidationContext<string> = undefined;
      if (error.contexts) {
        associatedContext = error.contexts[
          errorConstraintKey
        ] as ValidationContext<string>;
      }
      const errorDescription = error.constraints[errorConstraintKey];
      if (associatedContext?.type === ValidationContextTypes.Warning) {
        warnings.push({
          typeCode: associatedContext.typeCode,
          message: errorDescription,
        });
      } else if (
        associatedContext?.type === ValidationContextTypes.Information
      ) {
        infos.push({
          typeCode: associatedContext.typeCode,
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
 * Represent the context of an error that has an additional context to
 * express a possible warning or some relevant information captured during
 * the validation process.
 * All validations when failed will generate an error. The ones that have
 * the warning or information contexts will not be considered critical.
 */
export class ValidationContext<T> {
  /**
   * Creates an error context that will make the error downgrade to
   * a condition of a warning information.
   * @param warningTypeCode warning code that uniquely identifies this condition.
   * @returns the warning context.
   */
  static CreateWarning<T>(warningTypeCode: T): ValidationContext<T> {
    const newContext = new ValidationContext<T>();
    newContext.type = ValidationContextTypes.Warning;
    newContext.typeCode = warningTypeCode;
    return newContext;
  }

  /**
   * Creates an error context that will make the error downgraded to
   * a condition of a simple information.
   * @param infoTypeCode information code that uniquely identifies this condition.
   * @returns the information context.
   */
  static CreateInfo<T>(infoTypeCode: T): ValidationContext<T> {
    const newContext = new ValidationContext<T>();
    newContext.type = ValidationContextTypes.Information;
    newContext.typeCode = infoTypeCode;
    return newContext;
  }

  /**
   * Context type.
   */
  type: ValidationContextTypes;
  /**
   * Unique identifier of the validation error.
   */
  typeCode: T;
}

/**
 * Types of non-critical errors.
 */
export enum ValidationContextTypes {
  Warning = "warning",
  Information = "information",
}

/**
 * Validation warnings and infos with a unique typecode and
 * a user-friendly message to be displayed.
 */
export interface ValidationResult {
  typeCode: string;
  message: string;
}
