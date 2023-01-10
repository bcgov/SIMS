/**
 * Represents disbursement values as a single line in a ECE request file.
 * When implemented in a derived class this
 * interface allow the object to be represented
 * as a formatted fixed string.
 */
export interface ECERequestFileLine {
  getFixedFormat(): string;
}
