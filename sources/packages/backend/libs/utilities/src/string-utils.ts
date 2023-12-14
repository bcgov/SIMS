const REPLACE_LINE_BREAK_REGEX = /\r?\n|\r/g;

/**
 * Replace the line breaks in the given text.
 * @param data data to replace the line break.
 * @param options replace options:
 * - `replaceText`: text to replace the line break.
 * @returns line break replaced string.
 */
export function replaceLineBreaks(
  data?: string,
  options?: { replaceText?: string },
) {
  if (!data) {
    return data;
  }
  return data.replace(REPLACE_LINE_BREAK_REGEX, options?.replaceText ?? "");
}
