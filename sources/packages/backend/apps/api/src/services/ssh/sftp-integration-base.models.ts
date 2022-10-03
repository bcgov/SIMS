/**
 * Represents a single line in a integration file.
 * When implemented in a derived class this
 * interface allow the object to be represented
 * as a formatted fixed string.
 */
export interface FixedFormatFileLine {
  getFixedFormat(): string;
}
