import { SetMetadata } from "@nestjs/common";
import { InstitutionUserRoles } from "../user-types.enum";

export const IS_INSTITUTION_ADMIN_KEY = "is-institution-admin";

// Used to restrict access to the API endpoints to only institution administrators.
export const IsInstitutionAdmin = (...roles: InstitutionUserRoles[]) =>
  SetMetadata(IS_INSTITUTION_ADMIN_KEY, roles);
