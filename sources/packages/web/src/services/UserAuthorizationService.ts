import store from "@/store";
import {
  InstitutionRouteUserType,
  InstitutionUserTypes,
} from "@/types/contracts/InstitutionRouteMeta";
import { InstitutionUserAuthRolesAndLocation } from "@/types/contracts/institution/InstitutionUser";
export class UserAuthorizationService {
  private static instance: UserAuthorizationService;
  private isInstitutionAdmin = store.getters["institution/myDetails"]?.isAdmin;
  private institutionUserTypes: InstitutionUserAuthRolesAndLocation[] =
    store.getters["institution/myAuthorizationDetails"]?.authorizations;

  public static get shared(): UserAuthorizationService {
    return this.instance || (this.instance = new this());
  }

  public isUserTypeAllowed(
    allowedTypeList: string[],
    urlParams?: { locationId?: string },
    checkAllowedLocation?: { userTypes?: string[] },
  ) {
    /* Check is user is Institution Admin and Institution 
    Admin users has access to the requested page*/

    if (this.isInstitutionAdmin) {
      return allowedTypeList.some(
        type => type === InstitutionRouteUserType.ADMIN,
      );
    } else {
      if (checkAllowedLocation?.userTypes && urlParams?.locationId) {
        return checkAllowedLocation?.userTypes.some(type => {
          /* Check is user is location Manager and the 
            location Manager has access to the requested page and  
            check location Manager has access to the locationId 
          */
          if (type === InstitutionRouteUserType.LOCATION_MANAGER) {
            const allowManger = this.institutionUserTypes.some(
              authDetails =>
                authDetails?.userType ===
                  InstitutionUserTypes.locationManager &&
                authDetails?.locationId === Number(urlParams?.locationId),
            );
            if (allowManger) {
              return allowManger;
            }
          }
          /* Check is user is user and the 
            User has access to the requested page and  
            check User has access to the locationId
          */
          if (type === InstitutionRouteUserType.USER) {
            const allowUser = this.institutionUserTypes.some(
              authDetails =>
                authDetails?.userType === InstitutionUserTypes.user &&
                authDetails?.locationId === Number(urlParams?.locationId),
            );
            if (allowUser) {
              return allowUser;
            }
          }
          return false;
        });
      } else {
        return allowedTypeList.some(type => {
          /* Check is user is location Manager and the 
          location Manager has access to the requested page
        */
          if (type === InstitutionRouteUserType.LOCATION_MANAGER) {
            const isManger = this.institutionUserTypes.some(
              authDetails =>
                authDetails?.userType === InstitutionUserTypes.locationManager,
            );
            if (isManger) {
              return isManger;
            }
          }
          /* Check is user is user and the 
            User has access to the requested page
          */
          if (type === InstitutionRouteUserType.USER) {
            const isUser = this.institutionUserTypes.some(
              authDetails =>
                authDetails?.userType === InstitutionUserTypes.user,
            );
            if (isUser) {
              return isUser;
            }
          }
          return false;
        });
      }
    }
  }
}
