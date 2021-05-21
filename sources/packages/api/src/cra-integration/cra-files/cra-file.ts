/**
 * Represents a single line in a CRA file.
 * When implemented in a derived class this
 * interface allow the object to be represented
 * as a formatted fixed string.
 */
export interface CRAFileLine {
  getFixedFormat(): string;
}
