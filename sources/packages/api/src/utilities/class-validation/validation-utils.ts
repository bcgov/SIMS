import { ValidationError } from "class-validator";

export function flattenErrorMessages(errors: ValidationError[]): string[] {
  const allErrors: string[] = [];
  errors.forEach((error) => {
    const flattenedConstraints = flattenConstraints(error);
    const errorMessages = flattenedConstraints.flatMap((constraint) =>
      Object.values(constraint),
    );
    allErrors.push(...errorMessages);
  });
  return allErrors;
}

export function flattenConstraints(error: ValidationError): unknown[] {
  const flattenedConstraints: unknown[] = [];
  generateFlattenedConstraints(error, flattenedConstraints);
  return flattenedConstraints;
}

function generateFlattenedConstraints(
  error: ValidationError,
  flattenedConstraints: unknown[] = [],
) {
  if (error.constraints) {
    flattenedConstraints.push(error.constraints);
  }
  if (error.children) {
    error.children.forEach((childError) =>
      generateFlattenedConstraints(childError, flattenedConstraints),
    );
  }
}

export function flattenErrors(error: ValidationError) {
  const flattenedErrors: ValidationError[] = [];
  generateFlattenedErrors(error, flattenedErrors);
  return flattenedErrors;
}

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
