import { RouteLocationNormalized, RouteRecordRaw } from "vue-router";
import InstitutionDashboard from "@/views/institution/InstitutionDashboard.vue";
import InstitutionProfile from "@/views/institution/InstitutionProfile.vue";
import InstitutionCreate from "@/views/institution/InstitutionCreate.vue";
import InstitutionUserProfile from "@/views/institution/InstitutionUserProfile.vue";
import AppInstitution from "@/views/institution/AppInstitution.vue";
import ManageLocation from "@/views/institution/ManageLocations.vue";
import ApplicationDetails from "@/views/institution/ApplicationDetails.vue";
import LocationPrograms from "@/views/institution/locations/programs/LocationPrograms.vue";
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
import InstitutionApplicationSideBar from "@/components/layouts/Institution/sidebar/InstitutionApplicationSideBar.vue";
import LocationProgramAddEdit from "@/views/institution/locations/programs/LocationProgramAddEdit.vue";
import LocationCOERequest from "@/views/institution/locations/confirmation-of-enrollment/ApplicationDetailsForCOE.vue";
import LocationProgramView from "@/views/institution/locations/programs/LocationProgramView.vue";
import LocationProgramOfferingCreate from "@/views/institution/locations/offerings/OfferingCreate.vue";
import LocationProgramOfferingEdit from "@/views/institution/locations/offerings/OfferingEdit.vue";
import LocationEditProgramInfoRequest from "@/views/institution/locations/program-info-request/LocationEditProgramInfoRequest.vue";
import { RouteHelper } from "@/helpers";
import { AuthService } from "@/services/AuthService";
import ViewSubmittedApplicationScholasticStanding from "@/views/institution/locations/active-applications/ViewSubmittedApplicationScholasticStanding.vue";
import OfferingRequestChange from "@/views/institution/locations/offerings/OfferingRequestChange.vue";
import OfferingsUpload from "@/views/institution/OfferingsUpload.vue";
import WithdrawalUpload from "@/views/institution/WithdrawalUpload.vue";
import InstitutionSearchStudents from "@/views/institution/student/InstitutionSearchStudents.vue";
import InstitutionStudentDetails from "@/views/institution/student/InstitutionStudentDetails.vue";
import InstitutionStudentProfile from "@/views/institution/student/InstitutionStudentProfile.vue";
import InstitutionStudentApplications from "@/views/institution/student/InstitutionStudentApplications.vue";
import InstitutionApplicationView from "@/views/institution/student/InstitutionStudentApplicationView.vue";
import InstitutionStudentRestrictions from "@/views/institution/student/InstitutionStudentRestrictions.vue";
import InstitutionStudentFileUploads from "@/views/institution/student/InstitutionStudentFileUploads.vue";
import InstitutionStudentBalances from "@/views/institution/student/InstitutionStudentBalances.vue";
import InstitutionStudentNotes from "@/views/institution/student/InstitutionStudentNotes.vue";
import InstitutionAssessmentsSummary from "@/views/institution/student/applicationDetails/InstitutionAssessmentsSummary.vue";
import ApplicationExceptions from "@/views/institution/student/applicationDetails/ApplicationExceptions.vue";
import StudentAppealRequest from "@/views/institution/student/applicationDetails/StudentAppealRequest.vue";
import AssessmentAward from "@/views/institution/student/applicationDetails/AssessmentAward.vue";
import NoticeOfAssessment from "@/views/institution/student/applicationDetails/NoticeOfAssessment.vue";
import RequestApplicationChange from "@/views/institution/locations/request-a-change/RequestAChange.vue";
import RequestApplicationChangeFormSubmit from "@/views/institution/locations/request-a-change/RequestAChangeFormSubmit.vue";
import RequestApplicationChangeFormView from "@/views/institution/locations/request-a-change/RequestAChangeFormView.vue";
import AvailableToChange from "@/views/institution/locations/request-a-change/request-a-change/AvailableToChange.vue";
import InProgress from "@/views/institution/locations/request-a-change/request-a-change/InProgress.vue";
import Completed from "@/views/institution/locations/request-a-change/request-a-change/Completed.vue";

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
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.InstitutionStudentSearch,
        name: InstitutionRoutesConst.INSTITUTION_STUDENT_SEARCH,
        components: {
          default: InstitutionSearchStudents,
          sidebar: InstitutionHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.Institution,
          allowOnlyBCPublic: true,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
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
        props: {
          default: (route) => ({
            locationId: parseInt(route.params.locationId as string),
          }),
        },
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.ActiveApplicationsSummary,
        name: InstitutionRoutesConst.ACTIVE_APPLICATIONS_SUMMARY,
        components: {
          default: ActiveApplicationsSummary,
          sidebar: InstitutionHomeSideBar,
        },
        props: {
          default: (route: RouteLocationNormalized) => ({
            locationId: parseInt(route.params.locationId as string),
          }),
        },
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.RequestApplicationOfferingChange,
        name: InstitutionRoutesConst.REQUEST_CHANGE,
        redirect: {
          name: InstitutionRoutesConst.REQUEST_CHANGE_AVAILABLE_TO_CHANGE,
        },
        props: {
          default: (route: RouteLocationNormalized) => ({
            locationId: parseInt(route.params.locationId as string),
          }),
        },
        components: {
          default: RequestApplicationChange,
          sidebar: InstitutionHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
        children: [
          {
            path: AppRoutes.RequestApplicationOfferingChangeAvailableToChange,
            name: InstitutionRoutesConst.REQUEST_CHANGE_AVAILABLE_TO_CHANGE,
            component: AvailableToChange,
            props: (route: RouteLocationNormalized) => ({
              locationId: parseInt(route.params.locationId as string),
            }),
          },
          {
            path: AppRoutes.RequestApplicationOfferingChangeInProgress,
            name: InstitutionRoutesConst.REQUEST_CHANGE_IN_PROGRESS,
            props: (route: RouteLocationNormalized) => ({
              locationId: parseInt(route.params.locationId as string),
            }),
            component: InProgress,
          },
          {
            path: AppRoutes.RequestApplicationOfferingChangeCompleted,
            name: InstitutionRoutesConst.REQUEST_CHANGE_COMPLETED,
            props: (route: RouteLocationNormalized) => ({
              locationId: parseInt(route.params.locationId as string),
            }),
            component: Completed,
          },
        ],
      },
      {
        path: AppRoutes.RequestApplicationOfferingChangeSubmit,
        name: InstitutionRoutesConst.REQUEST_CHANGE_FORM_SUBMIT,
        components: {
          default: RequestApplicationChangeFormSubmit,
        },
        props: {
          default: (route: RouteLocationNormalized) => ({
            locationId: parseInt(route.params.locationId as string),
            applicationId: parseInt(route.params.applicationId as string),
          }),
        },
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.RequestApplicationOfferingChangeView,
        name: InstitutionRoutesConst.REQUEST_CHANGE_FORM_VIEW,
        components: {
          default: RequestApplicationChangeFormView,
        },
        props: {
          default: (route: RouteLocationNormalized) => ({
            locationId: parseInt(route.params.locationId as string),
            applicationOfferingChangeRequestId: parseInt(
              route.params.applicationOfferingChangeRequestId as string,
            ),
          }),
        },
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.ActiveApplicationEdit,
        name: InstitutionRoutesConst.ACTIVE_APPLICATION_EDIT,
        component: ActiveApplicationEdit,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.LocationProgramInfoRequestSummary,
        name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_SUMMARY,
        components: {
          default: LocationProgramInfoRequestSummary,
          sidebar: InstitutionHomeSideBar,
        },
        props: {
          default: (route) => ({
            locationId: parseInt(route.params.locationId as string),
          }),
        },
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.LocationCOESummary,
        name: InstitutionRoutesConst.COE_SUMMARY,
        components: {
          default: LocationCOESummary,
          sidebar: InstitutionHomeSideBar,
        },
        props: {
          default: (route) => ({
            locationId: parseInt(route.params.locationId as string),
          }),
        },
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.LocationProgramInfoRequestEdit,
        name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_EDIT,
        component: LocationEditProgramInfoRequest,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.LocationCOEDetails,
        name: InstitutionRoutesConst.COE_EDIT,
        component: LocationCOERequest,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
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
          clientType: ClientIdType.Institution,
          institutionUserTypes: [InstitutionUserTypes.admin],
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
          institutionUserTypes: [InstitutionUserTypes.admin],
        },
      },
      {
        path: AppRoutes.DesignationRequest,
        name: InstitutionRoutesConst.DESIGNATION_REQUEST,
        component: DesignationRequest,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [InstitutionUserTypes.admin],
          allowOnlyLegalSigningAuthority: true,
        },
      },
      {
        path: AppRoutes.DesignationView,
        name: InstitutionRoutesConst.DESIGNATION_VIEW,
        component: DesignationView,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [InstitutionUserTypes.admin],
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
          institutionUserTypes: [InstitutionUserTypes.admin],
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
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
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
          institutionUserTypes: [InstitutionUserTypes.admin],
        },
      },
      {
        path: AppRoutes.AddInstitutionLocation,
        name: InstitutionRoutesConst.ADD_INSTITUTION_LOCATION,
        component: AddInstitutionLocation,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [InstitutionUserTypes.admin],
        },
      },
      {
        path: `${AppRoutes.EditInstitutionLocation}/:locationId`,
        name: InstitutionRoutesConst.EDIT_INSTITUTION_LOCATION,
        component: EditInstitutionLocation,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.InstitutionProfile,
        name: InstitutionRoutesConst.INSTITUTION_PROFILE,
        component: InstitutionProfile,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
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
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.LocationProgramsCreate,
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        component: LocationProgramAddEdit,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.LocationProgramsEdit,
        name: InstitutionRoutesConst.EDIT_LOCATION_PROGRAMS,
        component: LocationProgramAddEdit,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.LocationProgramsOfferingsCreate,
        name: InstitutionRoutesConst.ADD_LOCATION_OFFERINGS,
        component: LocationProgramOfferingCreate,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.LocationOfferingsEdit,
        name: InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS,
        component: LocationProgramOfferingEdit,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.ActiveApplicationScholasticStandingView,
        name: InstitutionRoutesConst.SCHOLASTIC_STANDING_VIEW,
        component: ViewSubmittedApplicationScholasticStanding,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.LocationOfferingsRequestChange,
        name: InstitutionRoutesConst.OFFERING_REQUEST_CHANGE,
        component: OfferingRequestChange,
        props: true,
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
        },
      },
      {
        path: AppRoutes.OfferingsUpload,
        name: InstitutionRoutesConst.OFFERINGS_UPLOAD,
        components: {
          default: OfferingsUpload,
          sidebar: ManageInstitutionSideBar,
        },
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [InstitutionUserTypes.admin],
        },
      },
      {
        path: AppRoutes.WithdrawalUpload,
        name: InstitutionRoutesConst.WITHDRAWAL_UPLOAD,
        components: {
          default: WithdrawalUpload,
          sidebar: ManageInstitutionSideBar,
        },
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [InstitutionUserTypes.admin],
          allowOnlyBCPublic: true,
        },
      },
      {
        path: AppRoutes.StudentDetail,
        name: InstitutionRoutesConst.STUDENT_DETAILS,
        props: true,
        components: {
          default: InstitutionStudentDetails,
          sidebar: InstitutionHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
          allowOnlyBCPublic: true,
        },
        children: [
          {
            path: AppRoutes.StudentProfile,
            name: InstitutionRoutesConst.STUDENT_PROFILE,
            props: true,
            component: InstitutionStudentProfile,
            meta: {
              clientType: ClientIdType.Institution,
              institutionUserTypes: [
                InstitutionUserTypes.admin,
                InstitutionUserTypes.user,
              ],
            },
          },
          {
            path: AppRoutes.Applications,
            name: InstitutionRoutesConst.STUDENT_APPLICATIONS,
            props: true,
            component: InstitutionStudentApplications,
            meta: {
              clientType: ClientIdType.Institution,
              institutionUserTypes: [
                InstitutionUserTypes.admin,
                InstitutionUserTypes.user,
              ],
            },
          },
          {
            path: AppRoutes.Restrictions,
            name: InstitutionRoutesConst.STUDENT_RESTRICTIONS,
            props: true,
            component: InstitutionStudentRestrictions,
            meta: {
              clientType: ClientIdType.Institution,
              institutionUserTypes: [
                InstitutionUserTypes.admin,
                InstitutionUserTypes.user,
              ],
            },
          },
          {
            path: AppRoutes.FileUploads,
            name: InstitutionRoutesConst.STUDENT_FILE_UPLOADS,
            props: true,
            component: InstitutionStudentFileUploads,
            meta: {
              clientType: ClientIdType.Institution,
              institutionUserTypes: [
                InstitutionUserTypes.admin,
                InstitutionUserTypes.user,
              ],
            },
          },
          {
            path: AppRoutes.Balances,
            name: InstitutionRoutesConst.STUDENT_BALANCES,
            props: true,
            component: InstitutionStudentBalances,
            meta: {
              clientType: ClientIdType.Institution,
              institutionUserTypes: [
                InstitutionUserTypes.admin,
                InstitutionUserTypes.user,
              ],
            },
          },
          {
            path: AppRoutes.Notes,
            name: InstitutionRoutesConst.STUDENT_NOTES,
            props: true,
            component: InstitutionStudentNotes,
            meta: {
              clientType: ClientIdType.Institution,
              institutionUserTypes: [
                InstitutionUserTypes.admin,
                InstitutionUserTypes.user,
              ],
            },
          },
        ],
      },
      {
        path: AppRoutes.ApplicationDetail,
        redirect: { name: InstitutionRoutesConst.STUDENT_APPLICATION_DETAILS },
        props: true,
        components: {
          default: ApplicationDetails,
          sidebar: InstitutionApplicationSideBar,
        },
        meta: {
          clientType: ClientIdType.Institution,
          institutionUserTypes: [
            InstitutionUserTypes.admin,
            InstitutionUserTypes.user,
          ],
          allowOnlyBCPublic: true,
        },
        children: [
          {
            path: AppRoutes.ApplicationView,
            name: InstitutionRoutesConst.STUDENT_APPLICATION_DETAILS,
            props: true,
            component: InstitutionApplicationView,
          },
          {
            path: AppRoutes.AssessmentSummary,
            name: InstitutionRoutesConst.ASSESSMENTS_SUMMARY,
            props: true,
            component: InstitutionAssessmentsSummary,
          },
          {
            path: AppRoutes.ApplicationException,
            name: InstitutionRoutesConst.APPLICATION_EXCEPTION,
            props: true,
            component: ApplicationExceptions,
          },
          {
            path: AppRoutes.StudentAppealRequest,
            name: InstitutionRoutesConst.STUDENT_APPEAL_REQUEST,
            props: true,
            component: StudentAppealRequest,
          },
          {
            path: AppRoutes.AssessmentAwardView,
            name: InstitutionRoutesConst.ASSESSMENT_AWARD_VIEW,
            props: true,
            component: AssessmentAward,
          },
          {
            path: AppRoutes.NoticeOfAssessmentView,
            name: InstitutionRoutesConst.NOTICE_OF_ASSESSMENT_VIEW,
            props: true,
            component: NoticeOfAssessment,
          },
        ],
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
              default: {
                next({
                  name: SharedRouteConst.FORBIDDEN_USER,
                });
              }
            }
          }
        })
        .catch((error: unknown) => {
          console.error(error);
          throw error;
        });
    },
  },
];
