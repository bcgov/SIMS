/**
 * Parse the json error in a prettier format for better
 * readability.
 * @param value to be parsed.
 * @returns json string in a prettier format.
 */
export function parseJSONError(value: unknown): string {
  return JSON.stringify(value, Object.getOwnPropertyNames(value), 2);
}
