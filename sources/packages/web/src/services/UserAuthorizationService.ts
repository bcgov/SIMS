import store from "@/store";
import { InstitutionUserTypes } from "@/types/contracts/InstitutionRouteMeta";
import {
  InstitutionUserAuthRolesAndLocation,
  LocationStateForStore,
} from "@/types/contracts/institution/InstitutionUser";
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
      const isInstitutionAdmin: boolean =
        store.getters["institution/myDetails"]?.isAdmin ?? false;

      /* Check if user is an Institution Admin and Institution 
      Admin users has access to the requested page*/
      if (allowedTypeList && isInstitutionAdmin) {
        return allowedTypeList.some(
          type => type === InstitutionUserTypes.admin,
        );
      }

      if (checkAllowedLocation?.userTypes && urlParams?.locationId) {
        return this.checkAllowedLocationForUser(
          isInstitutionAdmin,
          checkAllowedLocation?.userTypes,
          urlParams?.locationId,
        );
      }

      return allowedTypeList.some(type => {
        /* Check if user a location Manager and the 
            location Manager has access to the requested page
          */
        if (
          this.checkUserTypeIsAllowed(
            type,
            InstitutionUserTypes.locationManager,
          )
        )
          return true;

        /* Check if user a user and the 
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
    if (locationId) {
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
    return false;
  }

  public checkAdminAllowedForLocation(
    isInstitutionAdmin: boolean,
    allowedUserType: string,
    userType: string,
    locationId?: string,
  ) {
    if (isInstitutionAdmin && allowedUserType === userType && locationId) {
      const adminAllowedLocations: LocationStateForStore[] =
        store.getters["institution/myInstitutionLocations"];

      return adminAllowedLocations.some(
        locationDetails => locationDetails?.id === Number(locationId),
      );
    }
    return false;
  }

  public checkAllowedLocationForUser(
    isInstitutionAdmin: boolean,
    checkAllowedLocationUserTypes?: string[],
    urlParamsLocationId?: string,
  ) {
    return checkAllowedLocationUserTypes?.some(type => {
      /* Check if user a location Manager and the 
          location Manager has access to the requested page and  
          check location Manager has access to the locationId 
        */
      if (
        this.checkUserTypeIsAllowedForLocation(
          type,
          InstitutionUserTypes.locationManager,
          urlParamsLocationId,
        )
      )
        return true;

      /* Check if user a user and the 
          User has access to the requested page and  
          check User has access to the locationId
        */
      if (
        this.checkUserTypeIsAllowedForLocation(
          type,
          InstitutionUserTypes.user,
          urlParamsLocationId,
        )
      )
        return true;

      /* Check if user a admin and the 
          Admin has access to the requested page and  
          check Admin has access to the locationId
        */
      if (
        this.checkAdminAllowedForLocation(
          isInstitutionAdmin,
          type,
          InstitutionUserTypes.admin,
          urlParamsLocationId,
        )
      )
        return true;

      return false;
    });
  }
}
