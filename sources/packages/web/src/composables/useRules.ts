import { useValidators } from "@/composables";

const NOTES_MAX_CHARACTERS = 500;
const GIVENNAMES_MAX_LENGTH = 100;
const LASTNAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 300;
const { isSINValid, checkMaxCharacters, isEmailValid } = useValidators();

export function useRules() {
  const sinValidationRule = (sin: string) => {
    if (sin) {
      return isSINValid(sin) || "Please provide a proper SIN.";
    }
    return "SIN is required.";
  };

  const checkNotesLengthRule = (notes: string) => {
    return checkLengthRule(notes, NOTES_MAX_CHARACTERS, "Note");
  };

  const checkGivenNameLengthRule = (givenName: string) => {
    return checkLengthRule(
      givenName,
      GIVENNAMES_MAX_LENGTH,
      "Given Names",
      false,
    );
  };

  const checkLastNameLengthRule = (lastName: string) => {
    return checkLengthRule(lastName, LASTNAME_MAX_LENGTH, "Lastname");
  };

  const checkEmailLengthRule = (email: string) => {
    return checkLengthRule(email, EMAIL_MAX_LENGTH, "Email");
  };

  const checkEmailValidationRule = (email: string) => {
    return isEmailValid(email) ? true : "Email is invalid.";
  };

  const checkLengthRule = (
    value: string,
    maxLength: number,
    fieldName?: string,
    requiredValidation = true,
  ) => {
    if (value) {
      return (
        checkMaxCharacters(value, maxLength) || `Max ${maxLength} characters.`
      );
    }
    if (!requiredValidation) {
      return true;
    }
    if (fieldName) {
      return `${fieldName} is required.`;
    }
    return "Required field.";
  };

  const checkStringDateFormatRule = (dateString: string) => {
    if (dateString) {
      return (
        !!dateString.match(/^\d{4}-\d{2}-\d{2}$/) ||
        "Expiry end date is not in right format."
      );
    }
    return "Expiry end date is required.";
  };

  /**
   * Check if a value is truthy and has some length.
   * All values are truthy except false, 0, -0, 0n,
   * "", null, undefined, and NaN.
   * @param value value to be checked.
   * @param fieldName friendly field name to be added
   * to the validation message.
   * @returns true if the value is truthy and has some length,
   * otherwise a validation message.
   */
  const checkNullOrEmptyRule = (value: string | number, fieldName: string) => {
    if (value && value.toString().length > 0) {
      return true;
    }
    return `${fieldName} is required.`;
  };

  const checkOnlyDigitsRule = (value: string, fieldName: string) => {
    if (!/^\d+$/.test(value)) {
      return `${fieldName} is invalid.`;
    }
    return true;
  };

  /**
   * Checks if a number is between a range (inclusive check).
   * @param value value to be checked.
   * @param min min value allowed (inclusive check).
   * @param max max value allowed (inclusive check).
   * @param fieldName optional field name to be added to the message.
   * @param numberFormatter optional formatter to display min and max
   * on the validation message.
   * @returns true if the value is between the min and max value,
   * otherwise a validation message.
   */
  const numberRangeRule = (
    value: string,
    min: number,
    max: number,
    fieldName: string,
    numberFormatter: (value: number | string) => string,
  ) => {
    const numberValue = parseFloat(value);
    if (numberValue < min || numberValue > max) {
      let minText = min.toString();
      let maxText = max.toString();
      if (numberFormatter) {
        minText = numberFormatter(minText);
        maxText = numberFormatter(maxText);
      }
      return `${fieldName} must be between ${minText} and ${maxText}.`;
    }
    return true;
  };

  return {
    sinValidationRule,
    checkNotesLengthRule,
    checkStringDateFormatRule,
    checkNullOrEmptyRule,
    checkOnlyDigitsRule,
    checkLengthRule,
    numberRangeRule,
    checkGivenNameLengthRule,
    checkLastNameLengthRule,
    checkEmailLengthRule,
    checkEmailValidationRule,
  };
}
