/**
 * Remove all white spaces on start, middle and end from the string.
 * @param @stringValue string to have the white spaces removed.
 * @returns string with no white spaces.
 */
export const removeWhiteSpaces = (stringValue: string): string => {
  return stringValue.replace(/\s/g, "");
};
