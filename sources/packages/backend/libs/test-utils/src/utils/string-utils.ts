/**
 * Truncates a string to the specified maximum length.
 * If the string is shorter than or equal to the maximum length, it is returned unchanged.
 * @param value string to be truncated.
 */
export function truncateString(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength);
}
