import { validate as uuidValidate, version as uuidVersion } from "uuid";

/**
 * Validate if a string represents a valid UUID v4.
 */
export const uuidV4Matcher: jest.AsymmetricMatcher = {
  /**
   * Executes the match validation in the received value.
   * @param value Value to be validated.
   * @returns True if the value is a valid UUID v4, false otherwise.
   */
  asymmetricMatch: (value: unknown) =>
    typeof value === "string" &&
    uuidValidate(value) &&
    uuidVersion(value) === 4,
};
