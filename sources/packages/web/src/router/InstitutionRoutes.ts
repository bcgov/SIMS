import { RouteRecordRaw } from "vue-router";
import InstitutionDashboard from "../views/institution/InstitutionDashboard.vue";
import InstitutionProfile from "../views/institution/DynamicInstitutionProfile.vue";
import AppInstitution from "../views/institution/AppInstitution.vue";
import ManageLocation from "../views/institution/ManageLocations.vue";
import AddInstitutionLocation from "../views/institution/AddInstitutionLocation.vue";
import ManageDesgination from "../views/institution/ManageDesgination.vue";
import InstitutionUserDetails from "../views/institution/InstitutionUserDetails.vue";
import {
  InstitutionRoutesConst,
  SharedRouteConst,
} from "../constants/routes/RouteConstants";
import Login from "../views/institution/Login.vue";
import { AppConfigService } from "../services/AppConfigService";
import { ClientIdType } from "../types/contracts/ConfigContract";
import { AuthStatus, AppRoutes } from "../types";
import Institution from "../views/institution/Institution.vue";
import ManageInstitutionSideBar from "../components/layouts/Institution/sidebar/ManageInstitutionSideBar.vue";
import InstitutionHomeSideBar from "../components/layouts/Institution/sidebar/HomeSideBar.vue";

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
        path: "",
        redirect: `${AppRoutes.InstitutionRoot}/${AppRoutes.InstitutionDashboard}`,
        name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        component: Institution,
        children: [
          {
            path: AppRoutes.InstitutionDashboard,
            name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
            components: {
              default: InstitutionDashboard,
              sidebar: InstitutionHomeSideBar,
            },
          },
          {
            path: AppRoutes.InstitutionManageLocations,
            name: InstitutionRoutesConst.MANAGE_LOCATIONS,
            components: {
              default: ManageLocation,
              sidebar: ManageInstitutionSideBar,
            },
          },
          {
            path: AppRoutes.ManageInstitutionDesignation,
            name: InstitutionRoutesConst.MANAGE_DESGINATION,
            components: {
              default: ManageDesgination,
              sidebar: ManageInstitutionSideBar,
            },
          },
          {
            path: AppRoutes.InstitutionProfileEdit,
            name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
            components: {
              default: InstitutionProfile,
              sidebar: ManageInstitutionSideBar,
            },
          },
          {
            path: AppRoutes.InstitutionManageUsers,
            name: InstitutionRoutesConst.MANAGE_USERS,
            component: InstitutionUserDetails,
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
