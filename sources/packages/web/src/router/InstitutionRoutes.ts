import { RouteRecordRaw } from "vue-router";
import InstitutionDashboard from "../views/institution/InstitutionDashboard.vue";
import InstitutionProfile from "../views/institution/DynamicInstitutionProfile.vue";
import AppInstitution from "../views/institution/AppInstitution.vue";
import ManageLocation from "../views/institution/ManageLocations.vue";
import LocationPrograms from "../views/institution/locations/programs/LocationPrograms.vue";
import LocationUsers from "../views/institution/LocationUsers.vue";
import LocationProgramInfoRequestSummary from "../views/institution/locations/program-info-request/LocationProgramInfoRequestSummary.vue";
import LocationCOESummary from "../views/institution/locations/confirmation-of-enrollment/LocationCOESummary.vue";
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
import ManageInstitutionSideBar from "../components/layouts/Institution/sidebar/ManageInstitutionSideBar.vue";
import InstitutionHomeSideBar from "../components/layouts/Institution/sidebar/HomeSideBar.vue";
import LocationProgramAddEdit from "../views/institution/locations/programs/LocationProgramAddEdit.vue";
import LocationCOERequest from "../views/institution/locations/confirmation-of-enrollment/LocationEditCOERequest.vue";
import LocationProgramView from "../views/institution/locations/programs/LocationProgramView.vue";
import LocationProgramOffering from "../views/institution/locations/programs/LocationProgramOffering.vue";
import LocationEditProgramInfoRequest from "../views/institution/locations/program-info-request/LocationEditProgramInfoRequest.vue";
import { InstitutionUserTypes } from "@/types/contracts/InstitutionRouteMeta";

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
        meta: {
          requiresAuth: false,
          clientType: ClientIdType.INSTITUTION,
        },
      },
      {
        path: AppRoutes.LoginWithBusinessBCeID,
        name: InstitutionRoutesConst.LOGIN_WITH_BUSINESS_BCEID,
        component: Login,
        props: {
          showBasicBCeIDMessage: true,
          showDisabledUserMessage: false,
        },
        meta: {
          requiresAuth: false,
          clientType: ClientIdType.INSTITUTION,
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
        meta: {
          requiresAuth: false,
          clientType: ClientIdType.INSTITUTION,
        },
      },
      {
        path: AppRoutes.InstitutionDashboard,
        name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        components: {
          default: InstitutionDashboard,
          sidebar: InstitutionHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.INSTITUTION,
          userTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.locationManager,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.LocationPrograms,
        name: InstitutionRoutesConst.LOCATION_PROGRAMS,
        components: {
          default: LocationPrograms,
          sidebar: InstitutionHomeSideBar,
        },
        props: true,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [
              InstitutionUserTypes.admin,
              InstitutionUserTypes.locationManager,
              InstitutionUserTypes.user,
            ],
          },
        },
      },
      {
        path: AppRoutes.LocationProgramsView,
        name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
        components: {
          default: LocationProgramView,
          sidebar: InstitutionHomeSideBar,
        },
        props: true,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [
              InstitutionUserTypes.admin,
              InstitutionUserTypes.locationManager,
              InstitutionUserTypes.user,
            ],
          },
        },
      },
      {
        path: `${AppRoutes.LocationProgramInfoRequestSummary}`,
        name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_SUMMARY,
        components: {
          default: LocationProgramInfoRequestSummary,
          sidebar: InstitutionHomeSideBar,
        },
        props: true,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [
              InstitutionUserTypes.admin,
              InstitutionUserTypes.locationManager,
              InstitutionUserTypes.user,
            ],
          },
        },
      },
      {
        path: `${AppRoutes.LocationCOESummary}`,
        name: InstitutionRoutesConst.COE_SUMMARY,
        components: {
          default: LocationCOESummary,
          sidebar: InstitutionHomeSideBar,
        },
        props: true,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [
              InstitutionUserTypes.admin,
              InstitutionUserTypes.locationManager,
              InstitutionUserTypes.user,
            ],
          },
        },
      },
      {
        path: AppRoutes.LocationProgramInfoRequestEdit,
        name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_EDIT,
        components: {
          default: LocationEditProgramInfoRequest,
          sidebar: InstitutionHomeSideBar,
        },
        props: true,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [
              InstitutionUserTypes.admin,
              InstitutionUserTypes.locationManager,
              InstitutionUserTypes.user,
            ],
          },
        },
      },
      {
        path: AppRoutes.LocationCOEEdit,
        name: InstitutionRoutesConst.COE_EDIT,
        components: {
          default: LocationCOERequest,
          sidebar: InstitutionHomeSideBar,
        },
        props: true,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [
              InstitutionUserTypes.admin,
              InstitutionUserTypes.locationManager,
              InstitutionUserTypes.user,
            ],
          },
        },
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
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [
              InstitutionUserTypes.locationManager,
              InstitutionUserTypes.admin,
            ],
          },
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
          clientType: ClientIdType.INSTITUTION,
          userTypes: [InstitutionUserTypes.admin],
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
          clientType: ClientIdType.INSTITUTION,
          userTypes: [InstitutionUserTypes.admin],
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
          clientType: ClientIdType.INSTITUTION,
          userTypes: [InstitutionUserTypes.admin],
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
          clientType: ClientIdType.INSTITUTION,
          userTypes: [InstitutionUserTypes.admin],
        },
      },
      {
        path: AppRoutes.AddInstitutionLocation,
        name: InstitutionRoutesConst.ADD_INSTITUTION_LOCATION,
        component: AddInstitutionLocation,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          userTypes: [InstitutionUserTypes.admin],
        },
      },
      {
        path: `${AppRoutes.EditInstitutionLocation}/:locationId`,
        name: InstitutionRoutesConst.EDIT_INSTITUTION_LOCATION,
        component: EditInstitutionLocation,
        props: true,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin],
          },
        },
      },
      {
        path: AppRoutes.InstitutionProfile,
        name: InstitutionRoutesConst.INSTITUTION_PROFILE,
        component: InstitutionProfile,
        props: { editMode: false },
        meta: {
          clientType: ClientIdType.INSTITUTION,
        },
      },
      {
        path: AppRoutes.LocationProgramsView,
        name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
        component: LocationProgramView,
        props: true,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [
              InstitutionUserTypes.admin,
              InstitutionUserTypes.locationManager,
              InstitutionUserTypes.user,
            ],
          },
        },
      },
      {
        path: AppRoutes.LocationProgramsCreate,
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        component: LocationProgramAddEdit,
        props: true,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [
              InstitutionUserTypes.admin,
              InstitutionUserTypes.locationManager,
              InstitutionUserTypes.user,
            ],
          },
        },
      },
      {
        path: AppRoutes.LocationProgramsEdit,
        name: InstitutionRoutesConst.EDIT_LOCATION_PROGRAMS,
        component: LocationProgramAddEdit,
        props: true,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [
              InstitutionUserTypes.admin,
              InstitutionUserTypes.locationManager,
              InstitutionUserTypes.user,
            ],
          },
        },
      },
      {
        path: AppRoutes.LocationProgramsOfferingsCreate,
        name: InstitutionRoutesConst.ADD_LOCATION_OFFERINGS,
        component: LocationProgramOffering,
        props: true,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [
              InstitutionUserTypes.admin,
              InstitutionUserTypes.locationManager,
              InstitutionUserTypes.user,
            ],
          },
        },
      },
      {
        path: AppRoutes.LocationOfferingsEdit,
        name: InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS,
        component: LocationProgramOffering,
        props: true,
        meta: {
          clientType: ClientIdType.INSTITUTION,
          checkAllowedLocation: {
            userTypes: [
              InstitutionUserTypes.admin,
              InstitutionUserTypes.locationManager,
              InstitutionUserTypes.user,
            ],
          },
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
        .catch((e) => {
          console.error(e);
          throw e;
        });
    },
  },
];
