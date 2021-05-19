import { RouteRecordRaw } from "vue-router";
import InstitutionDashboard from "../views/institution/InstitutionDashboard.vue";
import InstitutionProfile from "../views/institution/DynamicInstitutionProfile.vue";
import AppInstitution from "../views/institution/AppInstitution.vue";
import ManageLocation from "../views/institution/ManageLocations.vue";
import AddInstitutionLocation from "../views/institution/AddInstitutionLocation.vue";
import {
  InstitutionRoutesConst,
  SharedRouteConst,
} from "../constants/routes/RouteConstants";
import Login from "../views/institution/Login.vue";
import { AppConfigService } from "../services/AppConfigService";
import { ClientIdType } from "../types/contracts/ConfigContract";
import { AuthStatus, AppRoutes } from "../types";

export const institutionRoutes: Array<RouteRecordRaw> = [
  {
    path: AppRoutes.InstitutionRoot,
    name: InstitutionRoutesConst.APP_INSTITUTION,
    component: AppInstitution,
    children: [
      {
        path: AppRoutes.Login,
        name: InstitutionRoutesConst.LOGIN,
        component: Login,
      },
      {
        path: AppRoutes.LoginWithBusinessBCeID,
        name: InstitutionRoutesConst.LOGIN_WITH_BUSINESS_BCEID,
        component: Login,
        props: { showBasicBCeIDMessage: true },
      },
      {
        path: AppRoutes.InstitutionDashboard,
        name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        component: InstitutionDashboard,
        children: [
          {
            path: AppRoutes.InstitutionManageLocations,
            name: InstitutionRoutesConst.MANAGE_LOCATIONS,
            component: ManageLocation,
          },
        ],
      },
      {
        path: AppRoutes.AddInstitutionLocation,
        name: InstitutionRoutesConst.ADD_INSTITUTION_LOCATION,
        component: AddInstitutionLocation,
      },
      {
        path: AppRoutes.InstitutionProfile,
        name: InstitutionRoutesConst.INSTITUTION_PROFILE,
        component: InstitutionProfile,
        props: { editMode: false },
      },
      {
        path: AppRoutes.InstitutionProfileEdit,
        name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
        component: InstitutionProfile,
      },
    ],
    beforeEnter: (to, from, next) => {
      AppConfigService.shared
        .initAuthService(ClientIdType.INSTITUTION)
        .then(() => {
          const status = AppConfigService.shared.authStatus({
            type: ClientIdType.INSTITUTION,
            path: to.path,
          });
          switch (status) {
            case AuthStatus.Continue:
              next();
              break;
            case AuthStatus.RequiredLogin:
              next({
                name: InstitutionRoutesConst.LOGIN,
              });
              break;
            case AuthStatus.RedirectHome:
              next({
                name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
              });
              break;
            case AuthStatus.ForbiddenUser:
              next({
                name: SharedRouteConst.FORBIDDEN_USER,
              });
              break;
            default: {
              next({
                name: SharedRouteConst.FORBIDDEN_USER,
              });
            }
          }
        })
        .catch(e => {
          console.error(e);
          throw e;
        });
    },
  },
];
