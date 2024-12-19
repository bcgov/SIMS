/**
 * Remove all white spaces on start, middle and end from the string.
 * @param stringValue string to have the white spaces removed.
 * @returns string with no white spaces.
 */
export const removeWhiteSpaces = (stringValue: string): string => {
  return stringValue.replace(/\s/g, "");
};

/**
 * Remove double white spaces from the entire string.
 * @param stringValue string to have the double spaces removed.
 * @returns string without double spaces.
 */
export const removeDoubleWhiteSpaces = (stringValue: string): string => {
  return stringValue.replace(/\s+/g, " ");
};
