import { validate as uuidValidate, version as uuidVersion } from "uuid";

/**
 * Validate if a string represents a valid UUID v4.
 */
export const uuidV4Matcher: jest.AsymmetricMatcher = {
  asymmetricMatch: (value: unknown) =>
    typeof value === "string" &&
    uuidValidate(value) &&
    uuidVersion(value) === 4,
};
