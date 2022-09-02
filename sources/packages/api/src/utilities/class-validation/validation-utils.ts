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

export function flattenContexts(error: ValidationError): unknown[] {
  const flattenedContexts: unknown[] = [];
  generateFlattenedContexts(error, flattenedContexts);
  return flattenedContexts;
}

function generateFlattenedContexts(
  error: ValidationError,
  flattenedContexts: unknown[] = [],
) {
  if (error.contexts) {
    flattenedContexts.push(error.contexts);
  }
  if (error.children) {
    error.children.forEach((childError) =>
      generateFlattenedContexts(childError, flattenedContexts),
    );
  }
}
