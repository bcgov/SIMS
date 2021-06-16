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

  public isUserTypeAllowed(allowedTypeList: string[], urlParams?:{locationId?:string}) {
    console.log(urlParams,'++++++urlParams======NumberNumber', Number(urlParams?.locationId ?? 0))
    console.log(this.institutionUserTypes,'++++++++this.institutionUserTypesthis.institutionUserTypes')
    if (this.isInstitutionAdmin) {
      return allowedTypeList.some(
        type => type === InstitutionRouteUserType.ADMIN,
      );
    } else {
      return allowedTypeList.some(type => {
        if (type === InstitutionRouteUserType.LOCATION_MANAGER) {
          const isManger = this.institutionUserTypes.some(
            authDetails =>
              
                //  {
                //    const locationId = urlParams?.locationId ? Number(urlParams?.locationId) : 0
                //    console.log(locationId,'+++++++++++++++locationIdlocationId')
                //    return }
                   authDetails?.userType === InstitutionUserTypes.locationManager,
          );
          if (isManger) {
            return isManger;
          }
        }
        if (type === InstitutionRouteUserType.USER) {
          const isUser = this.institutionUserTypes.some(
            authDetails => authDetails?.userType === InstitutionUserTypes.user,
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
