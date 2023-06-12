/**
 * Encode a given string to Base64 string.
 * @param stringToEncode string content to encode.
 * @returns Base64 encoded string.
 */
export function base64Encode(stringToEncode: string): string {
  return Buffer.from(stringToEncode, "binary").toString("base64");
}
