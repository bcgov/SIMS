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

  const checkNullOrEmptyString = (value?: string) => {
    if (value) {
      return value.length != 0;
    }
  };

  return {
    sinValidationRule,
    checkNotesLengthRule,
    checkStringDateFormatRule,
    checkNullOrEmptyString,
  };
}
