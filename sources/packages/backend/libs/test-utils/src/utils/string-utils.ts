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

/**
 * Format a number string as a SIN number (XXX XXX XXX).
 * @param value string of digits to be formatted as a SIN number.
 * @returns the input string formatted as a SIN number.
 */
export function applySINNumberFormat(value: string): string {
  // Remove any non-digit characters.
  const digits = value.replace(/\D/g, "");
  // Format as XXX XXX XXX.
  return digits.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}
