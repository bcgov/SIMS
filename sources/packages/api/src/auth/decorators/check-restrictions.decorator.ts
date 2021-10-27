import { SetMetadata } from "@nestjs/common";

/**
 * This decorator validates if the user has any restrictions before authorizing to access.
 */
export const CHECK_RESTRICTIONS_KEY = "check-restrictions";
export const CheckRestrictions = () =>
  SetMetadata(CHECK_RESTRICTIONS_KEY, true);
