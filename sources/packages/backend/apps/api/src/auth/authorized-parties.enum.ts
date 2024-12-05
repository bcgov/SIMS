/**
 * Authorized parties recognized by the API.
 * This is present on azp token claim.
 */
export enum AuthorizedParties {
  institution = "institution",
  student = "student",
  aest = "aest",
  supportingUsers = "supporting-users",
  external = "external",
}
