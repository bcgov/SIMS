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

/**
 * Encodes a filename for Content-Disposition header, providing both UTF-8 and fallback versions
 * @param fileName Original filename to encode
 * @returns Object containing encoded filename and fallback filename
 */
export function encodeFileNameForContentDisposition(fileName: string): string {
  const encodedFileName = encodeURIComponent(fileName);
  const fallbackFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `attachment; filename="${fallbackFileName}"; filename*=UTF-8''${encodedFileName}`;
}
