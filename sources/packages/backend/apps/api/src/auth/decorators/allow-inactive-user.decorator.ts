import { SetMetadata } from "@nestjs/common";

// Allow an inactive user to have access API methods when needed.
export const ALLOW_INACTIVE_USER_KEY = "allow-inactive-user-key";
export const AllowInactiveUser = () =>
  SetMetadata(ALLOW_INACTIVE_USER_KEY, true);
