import { useValidators } from "@/composables";

const NOTES_MAX_CHARACTERS = 500;
const { isSINValid, checkMaxCharacters } = useValidators();

export function useRules() {
  const sinValidationRule = (sin: string) => {
    if (sin) {
      return isSINValid(sin) || "Please provide a proper SIN.";
    }
    return "SIN is required.";
  };

  const checkNotesLengthRule = (notes: string) => {
    if (notes) {
      return (
        checkMaxCharacters(notes, NOTES_MAX_CHARACTERS) ||
        `Max ${NOTES_MAX_CHARACTERS} characters.`
      );
    }
    return "Note body is required.";
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

  const checkNullOrEmptyRule = (value: string, fieldName: string) => {
    if (value && value !== null && value.length > 0) {
      return true;
    }
    return `${fieldName} is required.`;
  };

  /**
   * Check if a value is truthy.
   * All values are truthy except false, 0, -0, 0n,
   * "", null, undefined, and NaN.
   * @param value value to be checked.
   * @param fieldName friendly field name to be added
   * to the validation message.
   * @returns true if the value is truthy,
   * otherwise a validation message.
   */
  const truthyRule = (value: string, fieldName: string) => {
    if (value) {
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
      return `${
        fieldName ?? "Value"
      } must be between ${minText} and ${maxText}.`;
    }
    return true;
  };

  return {
    sinValidationRule,
    checkNotesLengthRule,
    checkStringDateFormatRule,
    checkNullOrEmptyRule,
    checkOnlyDigitsRule,
    numberRangeRule,
    truthyRule,
  };
}
