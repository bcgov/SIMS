import { SetMetadata } from "@nestjs/common";

/**
 * Allow only BC public institution to access the API.
 */
export const INSTITUTION_IS_BC_PUBLIC_KEY = "institution-is-bc-public-key";
/**
 * Decorator to provide context that it's consumer must be
 * validated by the guard to be a BC Public institution.
 */
export const IsBCPublicInstitution = () =>
  SetMetadata(INSTITUTION_IS_BC_PUBLIC_KEY, true);
