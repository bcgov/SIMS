import { SetMetadata } from "@nestjs/common";
import { InstitutionUserRoles, InstitutionUserTypes } from "../user-types.enum";

export const IS_INSTITUTION_ADMIN_KEY = "is-institution-admin";
export const IsInstitutionAdmin = () =>
  SetMetadata(IS_INSTITUTION_ADMIN_KEY, true);

export const HAS_LOCATION_ACCESS_KEY = "has-location-access-key";
export const HasLocationAccess = (
  locationIdParamName: string,
  userType: InstitutionUserTypes[] = null,
  userRoles: InstitutionUserRoles[] = null,
) =>
  SetMetadata(HAS_LOCATION_ACCESS_KEY, {
    locationIdParamName,
    userType,
    userRoles,
  });

export interface HasLocationAccessParam {
  locationIdParamName: string;
  userType?: InstitutionUserTypes[];
  userRoles?: InstitutionUserRoles[];
}
