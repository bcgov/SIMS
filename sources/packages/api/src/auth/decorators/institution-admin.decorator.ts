import { SetMetadata } from "@nestjs/common";
import { InstitutionUserRoles } from "../user-types.enum";

export const IS_INSTITUTION_ADMIN_KEY = "is-institution-admin";
export const IsInstitutionAdmin = (...roles: InstitutionUserRoles[]) =>
  SetMetadata(IS_INSTITUTION_ADMIN_KEY, roles);
