import { SetMetadata } from "@nestjs/common";
import { InstitutionUserRoles, InstitutionUserTypes } from "../user-types.enum";

export const HAS_LOCATION_ACCESS_KEY = "has-location-access-key";

// Used to restrict access to the API endpoints considering the location specific permissions.
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
