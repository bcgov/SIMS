import { FieldRequirementType } from "@sims/sims-db";

/**
 * Validates a field requirement based on the provided field requirements.
 * @param fieldKey The key of the field to validate.
 * @param fieldValue The value of the field to validate.
 * @param fieldRequirements The field requirements to validate against.
 * @returns An error message if the field does not meet the requirement, otherwise undefined.
 */
function validateFieldRequirement(
  fieldKey: string,
  fieldValue: unknown,
  fieldRequirements: Record<string, FieldRequirementType>,
): undefined | string {
  const requirement = fieldRequirements[fieldKey];
  if (requirement === FieldRequirementType.Optional) {
    return;
  }
  const isValueProvided = Array.isArray(fieldValue)
    ? !!fieldValue.length
    : !!fieldValue;
  if (requirement === FieldRequirementType.Required && !isValueProvided) {
    return `${fieldKey} is required`;
  }
  if (requirement === FieldRequirementType.NotAllowed && isValueProvided) {
    return `${fieldKey} is not allowed`;
  }
}

/**
 * Validate field requirements.
 * @param fieldKeyValues
 * @param fieldRequirements
 * @returns validation result.
 */
export function validateFieldRequirements(
  fieldKeyValues: Map<string, unknown>,
  fieldRequirements: Record<string, FieldRequirementType>,
): { isValid: boolean; errorMessages: string[] } {
  const errorMessages: string[] = [];
  for (const [fieldKey, fieldValue] of fieldKeyValues.entries()) {
    const validationError = validateFieldRequirement(
      fieldKey,
      fieldValue,
      fieldRequirements,
    );
    if (validationError) {
      errorMessages.push(validationError);
    }
  }
  return {
    isValid: !errorMessages.length,
    errorMessages,
  };
}
