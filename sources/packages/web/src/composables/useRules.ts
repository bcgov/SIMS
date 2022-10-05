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

  return {
    sinValidationRule,
    checkNotesLengthRule,
  };
}
