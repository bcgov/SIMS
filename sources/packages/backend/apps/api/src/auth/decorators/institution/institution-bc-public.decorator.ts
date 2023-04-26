import { SetMetadata } from "@nestjs/common";

// Allow only BC public institution to access the API.
export const INSTITUTION_IS_BC_PUBLIC_KEY = "institution-is-bc-public-key";
export const IsBcPublicInstitution = () =>
  SetMetadata(INSTITUTION_IS_BC_PUBLIC_KEY, true);
