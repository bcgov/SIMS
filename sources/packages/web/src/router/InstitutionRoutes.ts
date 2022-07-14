import { RouteRecordRaw } from "vue-router";
import InstitutionDashboard from "@/views/institution/InstitutionDashboard.vue";
import InstitutionProfile from "@/views/institution/InstitutionProfile.vue";
import InstitutionCreate from "@/views/institution/InstitutionCreate.vue";
import InstitutionUserProfile from "@/views/institution/InstitutionUserProfile.vue";
import AppInstitution from "@/views/institution/AppInstitution.vue";
import ManageLocation from "@/views/institution/ManageLocations.vue";
import LocationPrograms from "@/views/institution/locations/programs/LocationPrograms.vue";
import LocationUsers from "@/views/institution/LocationUsers.vue";
import LocationProgramInfoRequestSummary from "@/views/institution/locations/program-info-request/LocationProgramInfoRequestSummary.vue";
import ActiveApplicationsSummary from "@/views/institution/locations/active-applications/LocationActiveApplicationSummary.vue";
import ActiveApplicationEdit from "@/views/institution/locations/active-applications/ActiveApplicationReportAChange.vue";
import LocationCOESummary from "@/views/institution/locations/confirmation-of-enrollment/LocationCOESummary.vue";
import AddInstitutionLocation from "@/views/institution/AddInstitutionLocation.vue";
import EditInstitutionLocation from "@/views/institution/EditInstitutionLocation.vue";
import ManageDesignations from "@/views/institution/designations/ManageDesignations.vue";
import DesignationRequest from "@/views/institution/designations/DesignationRequest.vue";
import DesignationView from "@/views/institution/designations/DesignationView.vue";
import InstitutionUserDetails from "@/views/institution/InstitutionUserDetails.vue";
import {
  InstitutionRoutesConst,
  SharedRouteConst,
} from "@/constants/routes/RouteConstants";
import Login from "@/views/institution/Login.vue";
import { ClientIdType } from "@/types/contracts/ConfigContract";
import { AuthStatus, AppRoutes, InstitutionUserTypes } from "@/types";
import ManageInstitutionSideBar from "@/components/layouts/Institution/sidebar/ManageInstitutionSideBar.vue";
import InstitutionHomeSideBar from "@/components/layouts/Institution/sidebar/HomeSideBar.vue";
import LocationProgramAddEdit from "@/views/institution/locations/programs/LocationProgramAddEdit.vue";
import LocationCOERequest from "@/views/institution/locations/confirmation-of-enrollment/ApplicationDetailsForCOE.vue";
import LocationProgramView from "@/views/institution/locations/programs/LocationProgramView.vue";
import LocationProgramOffering from "@/views/institution/locations/programs/LocationProgramOffering.vue";
import LocationEditProgramInfoRequest from "@/views/institution/locations/program-info-request/LocationEditProgramInfoRequest.vue";
import { RouteHelper } from "@/helpers";
import { AuthService } from "@/services/AuthService";
import ViewSubmittedApplicationScholasticStanding from "@/views/institution/locations/active-applications/ViewSubmittedApplicationScholasticStanding.vue";
import OfferingRequestChange from "@/views/institution/locations/offerings/OfferingRequestChange.vue";

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
          clientType: ClientIdType.Institution,
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
          clientType: ClientIdType.Institution,
        },
      },
      {
        path: AppRoutes.UnknownUser,
        name: InstitutionRoutesConst.UNKNOWN_LOGIN,
        component: Login,
        props: {
          showBasicBCeIDMessage: false,
          showDisabledUserMessage: false,
          showUnknownUserMessage: true,
        },
        meta: {
          requiresAuth: false,
          clientType: ClientIdType.Institution,
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
          clientType: ClientIdType.Institution,
          userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
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
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
          },
        },
      },
      {
        path: AppRoutes.ActiveApplicationsSummary,
        name: InstitutionRoutesConst.ACTIVE_APPLICATIONS_SUMMARY,
        components: {
          default: ActiveApplicationsSummary,
          sidebar: InstitutionHomeSideBar,
        },
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
          },
        },
      },
      {
        path: AppRoutes.ActiveApplicationEdit,
        name: InstitutionRoutesConst.ACTIVE_APPLICATION_EDIT,
        components: {
          default: ActiveApplicationEdit,
          sidebar: InstitutionHomeSideBar,
        },
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
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
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
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
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
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
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
          },
        },
      },
      {
        path: AppRoutes.LocationCOEDetails,
        name: InstitutionRoutesConst.COE_EDIT,
        components: {
          default: LocationCOERequest,
          sidebar: InstitutionHomeSideBar,
        },
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
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
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin],
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
          clientType: ClientIdType.Institution,
          userTypes: [InstitutionUserTypes.admin],
        },
      },
      {
        path: AppRoutes.ManageInstitutionDesignation,
        name: InstitutionRoutesConst.MANAGE_DESIGNATION,
        components: {
          default: ManageDesignations,
          sidebar: ManageInstitutionSideBar,
        },
        meta: {
          clientType: ClientIdType.Institution,
          userTypes: [InstitutionUserTypes.admin],
        },
      },
      {
        path: AppRoutes.DesignationRequest,
        name: InstitutionRoutesConst.DESIGNATION_REQUEST,
        components: {
          default: DesignationRequest,
          sidebar: ManageInstitutionSideBar,
        },
        meta: {
          clientType: ClientIdType.Institution,
          userTypes: [InstitutionUserTypes.admin],
        },
      },
      {
        path: AppRoutes.DesignationView,
        name: InstitutionRoutesConst.DESIGNATION_VIEW,
        components: {
          default: DesignationView,
          sidebar: ManageInstitutionSideBar,
        },
        meta: {
          clientType: ClientIdType.Institution,
          userTypes: [InstitutionUserTypes.admin],
        },
        props: true,
      },
      {
        path: AppRoutes.InstitutionProfileEdit,
        name: InstitutionRoutesConst.INSTITUTION_PROFILE_EDIT,
        components: {
          default: InstitutionProfile,
          sidebar: ManageInstitutionSideBar,
        },
        meta: {
          clientType: ClientIdType.Institution,
          userTypes: [InstitutionUserTypes.admin],
        },
      },
      {
        path: AppRoutes.InstitutionUserProfile,
        name: InstitutionRoutesConst.INSTITUTION_USER_PROFILE,
        components: {
          default: InstitutionUserProfile,
          sidebar: InstitutionHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.Institution,
          userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
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
          clientType: ClientIdType.Institution,
          userTypes: [InstitutionUserTypes.admin],
        },
      },
      {
        path: AppRoutes.AddInstitutionLocation,
        name: InstitutionRoutesConst.ADD_INSTITUTION_LOCATION,
        component: AddInstitutionLocation,
        meta: {
          clientType: ClientIdType.Institution,
          userTypes: [InstitutionUserTypes.admin],
        },
      },
      {
        path: `${AppRoutes.EditInstitutionLocation}/:locationId`,
        name: InstitutionRoutesConst.EDIT_INSTITUTION_LOCATION,
        component: EditInstitutionLocation,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin],
          },
        },
      },
      {
        path: AppRoutes.InstitutionProfile,
        name: InstitutionRoutesConst.INSTITUTION_PROFILE,
        component: InstitutionProfile,
        meta: {
          clientType: ClientIdType.Institution,
        },
      },
      {
        path: AppRoutes.InstitutionCreate,
        name: InstitutionRoutesConst.INSTITUTION_CREATE,
        component: InstitutionCreate,
        meta: {
          clientType: ClientIdType.Institution,
        },
      },
      {
        path: AppRoutes.LocationProgramsView,
        name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
        component: LocationProgramView,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
          },
        },
      },
      {
        path: AppRoutes.LocationProgramsCreate,
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        component: LocationProgramAddEdit,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
          },
        },
      },
      {
        path: AppRoutes.LocationProgramsEdit,
        name: InstitutionRoutesConst.EDIT_LOCATION_PROGRAMS,
        component: LocationProgramAddEdit,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
          },
        },
      },
      {
        path: AppRoutes.LocationProgramsOfferingsCreate,
        name: InstitutionRoutesConst.ADD_LOCATION_OFFERINGS,
        component: LocationProgramOffering,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
          },
        },
      },
      {
        path: AppRoutes.LocationOfferingsEdit,
        name: InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS,
        component: LocationProgramOffering,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
          },
        },
      },
      {
        path: AppRoutes.ActiveApplicationScholasticStandingView,
        name: InstitutionRoutesConst.SCHOLASTIC_STANDING_VIEW,
        components: {
          default: ViewSubmittedApplicationScholasticStanding,
          sidebar: InstitutionHomeSideBar,
        },
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          checkAllowedLocation: {
            userTypes: [InstitutionUserTypes.admin, InstitutionUserTypes.user],
          },
        },
      },
      {
        path: AppRoutes.LocationOfferingsRequestChange,
        name: InstitutionRoutesConst.OFFERING_REQUEST_CHANGE,
        component: OfferingRequestChange,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
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
    beforeEnter: (to, _from, next) => {
      AuthService.shared
        .initialize(ClientIdType.Institution)
        .then(() => {
          const status = RouteHelper.getNavigationAuthStatus(
            ClientIdType.Institution,
            to.path,
          );

          if (AuthService.shared.priorityRedirect) {
            next(AuthService.shared.priorityRedirect);
            AuthService.shared.priorityRedirect = undefined;
          } else {
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
          }
        })
        .catch((e) => {
          console.error(e);
          throw e;
        });
    },
  },
];
