import { SetMetadata } from "@nestjs/common";

// Check if the given user has any restrictions on this decorator.
export const CHECK_RESTRICTIONS_KEY = "check-restrictions";
export const CheckRestrictions = () =>
  SetMetadata(CHECK_RESTRICTIONS_KEY, true);
