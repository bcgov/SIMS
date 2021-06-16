import { RouteRecordRaw } from "vue-router";
import InstitutionDashboard from "../views/institution/InstitutionDashboard.vue";
import InstitutionProfile from "../views/institution/DynamicInstitutionProfile.vue";
import AppInstitution from "../views/institution/AppInstitution.vue";
import ManageLocation from "../views/institution/ManageLocations.vue";
import LocationPrograms from "../views/institution/LocationPrograms.vue";
import LocationUsers from "../views/institution/LocationUsers.vue";
import LocationApplications from "../views/institution/LocationApplications.vue";
import AddInstitutionLocation from "../views/institution/AddInstitutionLocation.vue";
import EditInstitutionLocation from "../views/institution/EditInstitutionLocation.vue";
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
import LocationProgramAddEdit from "../views/institution/LocationProgramAddEdit.vue";
import LocationProgramOffering from "../views/institution/LocationProgramOffering.vue";
import { InstitutionRouteUserType } from "@/types/contracts/InstitutionRouteMeta";

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
        props: {
          showBasicBCeIDMessage: true,
          showDisabledUserMessage: false,
        },
      },
      {
        path: AppRoutes.DisabledUser,
        name: InstitutionRoutesConst.DISABLED_LOGIN,
        component: Login,
        props: {
          showBasicBCeIDMessage: false,
          showDisabledUserMessage: true,
        },
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
            meta: {
              requiresAuth: true,
              clientType: ClientIdType.INSTITUTION
            },
          },
          {
            path: `${AppRoutes.LocationPrograms}/:locationId`,
            name: InstitutionRoutesConst.LOCATION_PROGRAMS,
            components: {
              default: LocationPrograms,
              sidebar: InstitutionHomeSideBar,
            },
            props: true,
            meta: {
              requiresAuth: true,
              clientType: ClientIdType.INSTITUTION,
              userTypes: [
                InstitutionRouteUserType.ADMIN,
                InstitutionRouteUserType.LOCATION_MANAGER,
                InstitutionRouteUserType.USER,
              ],
            },
          },
          {
            path: `${AppRoutes.LocationOfferings}`,
            name: InstitutionRoutesConst.LOCATION_OFFERINGS,
            components: {
              default: LocationPrograms,
              sidebar: InstitutionHomeSideBar,
            },
            props: true,
            meta: {
              requiresAuth: true,
              clientType: ClientIdType.INSTITUTION,
              userTypes: [
                InstitutionRouteUserType.ADMIN,
                InstitutionRouteUserType.LOCATION_MANAGER,
                InstitutionRouteUserType.USER,
              ],
            },
          },
          {
            path: `${AppRoutes.LocationApplications}/:locationId`,
            name: InstitutionRoutesConst.LOCATION_STUDENTS,
            components: {
              default: LocationApplications,
              sidebar: InstitutionHomeSideBar,
            },
            props: true,
          },
          {
            path: `${AppRoutes.LocationUsers}/:locationId`,
            name: InstitutionRoutesConst.LOCATION_USERS,
            components: {
              default: LocationUsers,
              sidebar: InstitutionHomeSideBar,
            },
            props: true,
            meta: {
              requiresAuth: true,
              clientType: ClientIdType.INSTITUTION,
              userTypes: [
                InstitutionRouteUserType.ADMIN,
                InstitutionRouteUserType.LOCATION_MANAGER,
              ],
            },
          },
          {
            path: AppRoutes.InstitutionManageLocations,
            name: InstitutionRoutesConst.MANAGE_LOCATIONS,
            components: {
              default: ManageLocation,
              sidebar: ManageInstitutionSideBar,
            },
            meta: {
              requiresAuth: true,
              clientType: ClientIdType.INSTITUTION,
              userTypes: [InstitutionRouteUserType.ADMIN],
            },
          },
          {
            path: AppRoutes.ManageInstitutionDesignation,
            name: InstitutionRoutesConst.MANAGE_DESGINATION,
            components: {
              default: ManageDesgination,
              sidebar: ManageInstitutionSideBar,
            },
            meta: {
              requiresAuth: true,
              clientType: ClientIdType.INSTITUTION,
              userTypes: [InstitutionRouteUserType.ADMIN],
            },
          },
          {
            path: AppRoutes.InstitutionProfileEdit,
            name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
            components: {
              default: InstitutionProfile,
              sidebar: ManageInstitutionSideBar,
            },
            meta: {
              requiresAuth: true,
              clientType: ClientIdType.INSTITUTION,
              userTypes: [InstitutionRouteUserType.ADMIN],
            },
          },
          {
            path: AppRoutes.InstitutionManageUsers,
            name: InstitutionRoutesConst.MANAGE_USERS,
            components: {
              default: InstitutionUserDetails,
              sidebar: ManageInstitutionSideBar,
            },
            meta: {
              requiresAuth: true,
              clientType: ClientIdType.INSTITUTION,
              userTypes: [InstitutionRouteUserType.ADMIN],
            },
          },
        ],
      },
      {
        path: AppRoutes.AddInstitutionLocation,
        name: InstitutionRoutesConst.ADD_INSTITUTION_LOCATION,
        component: AddInstitutionLocation,
        meta: {
          requiresAuth: true,
          clientType: ClientIdType.INSTITUTION,
          userTypes: [InstitutionRouteUserType.ADMIN],
        },
      },
      {
        path: `${AppRoutes.EditInstitutionLocation}/:locationId`,
        name: InstitutionRoutesConst.EDIT_INSTITUTION_LOCATION,
        component: EditInstitutionLocation,
        props: true,
        meta: {
          requiresAuth: true,
          clientType: ClientIdType.INSTITUTION,
          userTypes: [InstitutionRouteUserType.ADMIN],
        },
      },
      {
        path: AppRoutes.InstitutionProfile,
        name: InstitutionRoutesConst.INSTITUTION_PROFILE,
        component: InstitutionProfile,
        props: { editMode: false },
        meta: {
          requiresAuth: true,
          clientType: ClientIdType.INSTITUTION,
          userTypes: [InstitutionRouteUserType.ADMIN],
        },
      },
      {
        path: AppRoutes.LocationProgramsCreate,
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        component: LocationProgramAddEdit,
        props: true,
        meta: {
          requiresAuth: true,
          clientType: ClientIdType.INSTITUTION,
          userTypes: [
            InstitutionRouteUserType.ADMIN,
            InstitutionRouteUserType.LOCATION_MANAGER,
            InstitutionRouteUserType.USER,
          ],
        },
      },
      {
        path: AppRoutes.LocationProgramsOfferingsCreate,
        name: InstitutionRoutesConst.ADD_LOCATION_OFFERINGS,
        component: LocationProgramOffering,
        props: true,
        meta: {
          requiresAuth: true,
          clientType: ClientIdType.INSTITUTION,
          userTypes: [
            InstitutionRouteUserType.ADMIN,
            InstitutionRouteUserType.LOCATION_MANAGER,
            InstitutionRouteUserType.USER,
          ],
        },
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
