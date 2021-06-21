import store from "@/store";
import { InstitutionUserTypes } from "@/types/contracts/InstitutionRouteMeta";
import { InstitutionUserAuthRolesAndLocation } from "@/types/contracts/institution/InstitutionUser";
export class UserAuthorizationService {
  private static instance: UserAuthorizationService;

  public static get shared(): UserAuthorizationService {
    return this.instance || (this.instance = new this());
  }

  public isUserTypeAllowed(
    allowedTypeList: string[],
    urlParams?: { locationId?: string },
    checkAllowedLocation?: { userTypes?: string[] },
  ) {
    try {
      const isInstitutionAdmin =
        store.getters["institution/myDetails"]?.isAdmin;

      /* Check is user a Institution Admin and Institution 
      Admin users has access to the requested page*/

      if (isInstitutionAdmin) {
        return allowedTypeList.some(
          type => type === InstitutionUserTypes.admin,
        );
      }

      if (checkAllowedLocation?.userTypes && urlParams?.locationId) {
        return checkAllowedLocation?.userTypes.some(type => {
          /* Check is user a location Manager and the 
              location Manager has access to the requested page and  
              check location Manager has access to the locationId 
            */
          if (
            this.checkUserTypeIsAllowedForLocation(
              type,
              InstitutionUserTypes.locationManager,
              urlParams.locationId,
            )
          )
            return true;

          /* Check is user a user and the 
              User has access to the requested page and  
              check User has access to the locationId
            */
          if (
            this.checkUserTypeIsAllowedForLocation(
              type,
              InstitutionUserTypes.user,
              urlParams.locationId,
            )
          )
            return true;

          return false;
        });
      }

      return allowedTypeList.some(type => {
        /* Check is user a location Manager and the 
            location Manager has access to the requested page
          */
        if (
          this.checkUserTypeIsAllowed(
            type,
            InstitutionUserTypes.locationManager,
          )
        )
          return true;

        /* Check is user a user and the 
              User has access to the requested page
            */
        if (this.checkUserTypeIsAllowed(type, InstitutionUserTypes.user))
          return true;

        return false;
      });
    } catch (error) {
      return false;
    }
  }

  public checkUserTypeIsAllowed(allowedUserType: string, userType: string) {
    const institutionUserTypes: InstitutionUserAuthRolesAndLocation[] =
      store.getters["institution/myAuthorizationDetails"].authorizations;

    return (
      allowedUserType === userType &&
      institutionUserTypes.some(
        authDetails => authDetails?.userType === userType,
      )
    );
  }

  public checkUserTypeIsAllowedForLocation(
    allowedUserType: string,
    userType: string,
    locationId?: string,
  ) {
    const institutionUserTypes: InstitutionUserAuthRolesAndLocation[] =
      store.getters["institution/myAuthorizationDetails"].authorizations;

    return (
      allowedUserType === userType &&
      institutionUserTypes.some(
        authDetails =>
          authDetails?.userType === userType &&
          authDetails?.locationId === Number(locationId),
      )
    );
  }
}
