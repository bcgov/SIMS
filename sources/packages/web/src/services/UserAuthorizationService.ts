import store from "@/store";
import {
  InstitutionRouteUserType,
  InstitutionUserTypes,
} from "@/types/contracts/InstitutionRouteMeta";
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
    const isInstitutionAdmin = store.getters["institution/myDetails"]?.isAdmin;
    const institutionUserTypes: InstitutionUserAuthRolesAndLocation[] =
      store.getters["institution/myAuthorizationDetails"].authorizations;
    /* Check is user a Institution Admin and Institution 
    Admin users has access to the requested page*/

    if (isInstitutionAdmin) {
      return allowedTypeList.some(
        type => type === InstitutionRouteUserType.ADMIN,
      );
    } else {
      if (checkAllowedLocation?.userTypes && urlParams?.locationId) {
        return checkAllowedLocation?.userTypes.some(type => {
          /* Check is user a location Manager and the 
            location Manager has access to the requested page and  
            check location Manager has access to the locationId 
          */
          if (type === InstitutionRouteUserType.LOCATION_MANAGER) {
            if (institutionUserTypes.some(
              authDetails =>
                authDetails?.userType ===
                  InstitutionUserTypes.locationManager &&
                authDetails?.locationId === Number(urlParams?.locationId),
            )) return true
            
          }
          /* Check is user a user and the 
            User has access to the requested page and  
            check User has access to the locationId
          */
          if (type === InstitutionRouteUserType.USER) {
            if (institutionUserTypes.some(
              authDetails =>
                authDetails?.userType === InstitutionUserTypes.user &&
                authDetails?.locationId === Number(urlParams?.locationId),
            )) return true
          }
          return false;
        });
      } else {
        return allowedTypeList.some(type => {
          /* Check is user a location Manager and the 
          location Manager has access to the requested page
        */
          if (type === InstitutionRouteUserType.LOCATION_MANAGER) {
            if (institutionUserTypes.some(
              authDetails =>
                authDetails?.userType === InstitutionUserTypes.locationManager,
            )) return true
          }
          /* Check is user a user and the 
            User has access to the requested page
          */
          if (type === InstitutionRouteUserType.USER) {
            if(institutionUserTypes.some(
              authDetails =>
                authDetails?.userType === InstitutionUserTypes.user,
            )) return true
          }
          return false;
        });
      }
    }
  }
}
