import { RouteRecordRaw } from "vue-router";
import AppAEST from "@/views/aest/AppAEST.vue";
import Login from "@/views/aest/Login.vue";
import AESTDashboard from "@/views/aest/AESTDashboard.vue";
import SearchStudents from "@/views/aest/SearchStudents.vue";
import StudentDetails from "@/views/aest/student/StudentDetails.vue";
import StudentProfile from "@/views/aest/student/Profile.vue";
import StudentApplications from "@/views/aest/student/Applications.vue";
import ProgramDetails from "@/views/aest/institution/ProgramDetails.vue";
import SearchInstitutions from "@/views/aest/SearchInstitutions.vue";
import InstitutionDetails from "@/views/aest/institution/InstitutionDetails.vue";
import Profile from "@/views/aest/institution/Profile.vue";
import ProfileEdit from "@/views/aest/institution/ProfileEdit.vue";
import ProfileCreate from "@/views/aest/institution/ProfileCreate.vue";
import Programs from "@/views/aest/institution/Programs.vue";
import Locations from "@/views/aest/institution/Locations.vue";
import Users from "@/views/aest/institution/Users.vue";
import Designation from "@/views/aest/institution/Designation.vue";
import Restrictions from "@/views/aest/institution/Restrictions.vue";
import FileUploads from "@/views/aest/student/FileUploads.vue";
import InstitutionNotes from "@/views/aest/institution/InstitutionNotes.vue";
import ApplicationDetails from "@/views/aest/ApplicationDetails.vue";
import StudentApplicationView from "@/views/aest/StudentApplicationView.vue";
import AESTHomeSideBar from "@/components/layouts/aest/AESTHomeSideBar.vue";
import StudentNotes from "@/views/aest/student/StudentNotes.vue";
import StudentRestrictions from "@/views/aest/student/StudentRestrictions.vue";
import InstitutionLocationEdit from "@/views/aest/institution/InstitutionLocationEdit.vue";
import Reports from "@/views/aest/Reports.vue";
import ViewOffering from "@/views/aest/institution/ViewOffering.vue";
import CASInvoices from "@/views/aest/CASInvoices.vue";
import {
  AESTRoutesConst,
  SharedRouteConst,
} from "@/constants/routes/RouteConstants";
import { AppRoutes, AuthStatus } from "@/types";
import { ClientIdType } from "@/types/contracts/ConfigContract";
import { RouteHelper } from "@/helpers";
import { AuthService } from "@/services/AuthService";
import LocationProgramAddEdit from "@/views/institution/locations/programs/LocationProgramAddEdit.vue";
import AESTApplicationSideBar from "@/components/layouts/aest/AESTApplicationSideBar.vue";
import SupportingUser from "@/views/aest/SupportingUser.vue";
import PendingDesignations from "@/views/aest/institution/PendingDesignation.vue";
import DesignationAESTView from "@/views/aest/institution/DesignationAESTView.vue";
import AssessmentsSummary from "@/views/aest/student/applicationDetails/AssessmentsSummary.vue";
import StudentAppealRequestsApproval from "@/views/aest/student/applicationDetails/StudentAppealRequestsApproval.vue";
import NoticeOfAssessment from "@/views/aest/student/applicationDetails/NoticeOfAssessment.vue";
import ApplicationExceptionsApproval from "@/views/aest/student/applicationDetails/ApplicationExceptionsApproval.vue";
import ViewScholasticStanding from "@/views/aest/student/ViewScholasticStanding.vue";
import SINManagement from "@/views/aest/student/SINManagement.vue";
import CASSupplierInformation from "@/views/aest/student/CASSupplierInformation.vue";
import Balances from "@/views/aest/student/Balances.vue";
import StudentApplicationExceptions from "@/views/aest/student/StudentApplicationExceptions.vue";
import OfferingChangeRequests from "@/views/aest/institution/OfferingChangeRequests.vue";
import ViewOfferingChangeRequest from "@/views/aest/institution/ViewOfferingChangeRequest.vue";
import ViewPendingOfferingChangeRequests from "@/views/aest/institution/ViewPendingOfferingChangeRequests.vue";
import StudentApplicationAppeals from "@/views/aest/student/StudentApplicationAppeals.vue";
import ApplicationOfferingChangeRequestForm from "@/views/aest/institution/ApplicationOfferingChangeRequestForm.vue";
import StudentAccountApplications from "@/views/aest/student/StudentAccountApplications.vue";
import StudentAccountApplicationsApproval from "@/views/aest/student/StudentAccountApplicationsApproval.vue";
import AssessmentAward from "@/views/aest/student/applicationDetails/AssessmentAward.vue";
import ApplicationRestrictionsManagement from "@/views/aest/student/applicationDetails/ApplicationRestrictionsManagement.vue";
import ApplicationStatusTracker from "@/views/aest/student/applicationDetails/ApplicationStatusTracker.vue";

export const aestRoutes: Array<RouteRecordRaw> = [
  {
    path: AppRoutes.AESTRoot,
    name: AESTRoutesConst.APP_AEST,
    component: AppAEST,
    children: [
      {
        path: AppRoutes.Login,
        name: AESTRoutesConst.LOGIN,
        component: Login,
        meta: {
          requiresAuth: false,
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.NotAllowedUser,
        name: AESTRoutesConst.LOGIN_WITH_NOT_ALLOWED_USER,
        component: Login,
        props: {
          showNotAllowedUser: true,
        },
        meta: {
          requiresAuth: false,
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.AESTDashboard,
        name: AESTRoutesConst.AEST_DASHBOARD,
        components: {
          default: AESTDashboard,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.StudentDetail,
        name: AESTRoutesConst.STUDENT_DETAILS,
        props: true,
        components: {
          default: StudentDetails,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
        children: [
          {
            path: AppRoutes.StudentProfile,
            name: AESTRoutesConst.STUDENT_PROFILE,
            props: true,
            component: StudentProfile,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.Applications,
            name: AESTRoutesConst.STUDENT_APPLICATIONS,
            props: true,
            component: StudentApplications,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.Restrictions,
            name: AESTRoutesConst.STUDENT_RESTRICTION,
            props: true,
            component: StudentRestrictions,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.FileUploads,
            name: AESTRoutesConst.STUDENT_FILE_UPLOADS,
            props: true,
            component: FileUploads,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.Notes,
            name: AESTRoutesConst.STUDENT_NOTES,
            props: true,
            component: StudentNotes,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.SINManagement,
            name: AESTRoutesConst.SIN_MANAGEMENT,
            props: true,
            component: SINManagement,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.CASSupplierManagement,
            name: AESTRoutesConst.CAS_SUPPLIER_MANAGEMENT,
            props: (route) => ({
              studentId: parseInt(route.params.studentId as string),
            }),
            component: CASSupplierInformation,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.Balances,
            name: AESTRoutesConst.STUDENT_BALANCES,
            props: true,
            component: Balances,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
        ],
      },
      {
        path: AppRoutes.ApplicationDetail,
        redirect: { name: AESTRoutesConst.APPLICATION_DETAILS },
        props: true,
        components: {
          default: ApplicationDetails,
          sidebar: AESTApplicationSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
        children: [
          {
            path: AppRoutes.ApplicationView,
            name: AESTRoutesConst.APPLICATION_DETAILS,
            props: true,
            component: StudentApplicationView,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.SupportingUserDetail,
            name: AESTRoutesConst.SUPPORTING_USER_DETAILS,
            props: true,
            component: SupportingUser,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.AssessmentSummary,
            name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
            props: true,
            component: AssessmentsSummary,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.ScholasticStandingView,
            name: AESTRoutesConst.SCHOLASTIC_STANDING_VIEW,
            props: true,
            component: ViewScholasticStanding,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.StudentAppealRequest,
            name: AESTRoutesConst.STUDENT_APPEAL_REQUESTS_APPROVAL,
            props: true,
            component: StudentAppealRequestsApproval,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.StudentAESTApplicationOfferingChangeRequest,
            name: AESTRoutesConst.STUDENT_APPLICATION_OFFERING_CHANGE_REQUEST,
            component: ApplicationOfferingChangeRequestForm,
            props: (route) => ({
              applicationOfferingChangeRequestId: parseInt(
                route.params.applicationOfferingChangeRequestId as string,
              ),
              applicationId: parseInt(route.params.applicationId as string),
              studentId: parseInt(route.params.studentId as string),
            }),
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.NoticeOfAssessmentView,
            name: AESTRoutesConst.NOTICE_OF_ASSESSMENT_VIEW,
            props: true,
            component: NoticeOfAssessment,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.ApplicationException,
            name: AESTRoutesConst.APPLICATION_EXCEPTIONS_APPROVAL,
            props: true,
            component: ApplicationExceptionsApproval,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.AssessmentAwardView,
            name: AESTRoutesConst.ASSESSMENT_AWARD_VIEW,
            props: true,
            component: AssessmentAward,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.ApplicationRestrictionsManagement,
            name: AESTRoutesConst.APPLICATION_RESTRICTIONS_MANAGEMENT,
            props: true,
            component: ApplicationRestrictionsManagement,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.ApplicationStatusTracker,
            name: AESTRoutesConst.APPLICATION_STATUS_TRACKER,
            props: true,
            component: ApplicationStatusTracker,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.ApplicationVersionDetail,
            name: AESTRoutesConst.APPLICATION_VERSION_DETAILS,
            props: true,
            component: StudentApplicationView,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
        ],
      },
      {
        path: AppRoutes.SearchStudents,
        name: AESTRoutesConst.SEARCH_STUDENTS,
        components: {
          default: SearchStudents,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.SearchInstitutions,
        name: AESTRoutesConst.SEARCH_INSTITUTIONS,
        components: {
          default: SearchInstitutions,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.ProgramDetail,
        name: AESTRoutesConst.PROGRAM_DETAILS,
        props: true,
        components: {
          default: ProgramDetails,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.ViewProgram,
        name: AESTRoutesConst.VIEW_PROGRAM,
        props: true,
        components: {
          default: LocationProgramAddEdit,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.ViewOffering,
        name: AESTRoutesConst.VIEW_OFFERING,
        props: true,
        components: {
          default: ViewOffering,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.AESTEditInstitutionLocation,
        name: AESTRoutesConst.EDIT_INSTITUTION_LOCATION,
        component: InstitutionLocationEdit,
        props: true,
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.InstitutionDetail,
        name: AESTRoutesConst.INSTITUTION_DETAILS,
        props: true,
        components: {
          default: InstitutionDetails,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
        children: [
          {
            path: AppRoutes.AESTInstitutionProfile,
            name: AESTRoutesConst.INSTITUTION_PROFILE,
            props: true,
            component: Profile,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.Programs,
            name: AESTRoutesConst.INSTITUTION_PROGRAMS,
            props: true,
            component: Programs,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.Locations,
            name: AESTRoutesConst.INSTITUTION_LOCATIONS,
            props: true,
            component: Locations,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.Users,
            name: AESTRoutesConst.INSTITUTION_USERS,
            props: true,
            component: Users,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.Designation,
            name: AESTRoutesConst.INSTITUTION_DESIGNATION,
            props: true,
            component: Designation,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.Restrictions,
            name: AESTRoutesConst.INSTITUTION_RESTRICTIONS,
            props: true,
            component: Restrictions,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
          {
            path: AppRoutes.Notes,
            name: AESTRoutesConst.INSTITUTION_NOTES,
            props: true,
            component: InstitutionNotes,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
        ],
      },
      {
        path: AppRoutes.PendingDesignations,
        name: AESTRoutesConst.PENDING_DESIGNATIONS,
        components: {
          default: PendingDesignations,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.DesignationAESTView,
        name: AESTRoutesConst.DESIGNATION_VIEW,
        components: {
          default: DesignationAESTView,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
        props: true,
      },
      {
        path: AppRoutes.AESTInstitutionProfileEdit,
        name: AESTRoutesConst.INSTITUTION_PROFILE_EDIT,
        props: true,
        component: ProfileEdit,
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.AESTInstitutionProfileCreate,
        name: AESTRoutesConst.INSTITUTION_PROFILE_CREATE,
        components: {
          default: ProfileCreate,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.CASInvoices,
        name: AESTRoutesConst.CAS_INVOICES,
        components: {
          default: CASInvoices,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.Reports,
        name: AESTRoutesConst.REPORTS,
        components: {
          default: Reports,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.StudentAccountApplications,
        name: AESTRoutesConst.STUDENT_ACCOUNT_APPLICATIONS,
        components: {
          default: StudentAccountApplications,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.StudentAccountApplicationsApproval,
        name: AESTRoutesConst.STUDENT_ACCOUNT_APPLICATIONS_APPROVAL,
        props: true,
        components: {
          default: StudentAccountApplicationsApproval,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.Exceptions,
        name: AESTRoutesConst.APPLICATION_EXCEPTIONS_PENDING,
        components: {
          default: StudentApplicationExceptions,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.Appeals,
        name: AESTRoutesConst.APPLICATION_APPEALS_PENDING,
        components: {
          default: StudentApplicationAppeals,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.OfferingChangeRequests,
        name: AESTRoutesConst.OFFERING_CHANGE_REQUESTS,
        components: {
          default: OfferingChangeRequests,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.ViewOfferingChangeRequest,
        name: AESTRoutesConst.OFFERING_CHANGE_REQUEST_VIEW,
        props: true,
        components: {
          default: ViewOfferingChangeRequest,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.PendingApplicationOfferingChangeRequests,
        name: AESTRoutesConst.REQUEST_CHANGE_OFFERINGS,
        components: {
          default: ViewPendingOfferingChangeRequests,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
    ],
    beforeEnter: (to, _from, next) => {
      AuthService.shared
        .initialize(ClientIdType.AEST)
        .then(() => {
          const status = RouteHelper.getNavigationAuthStatus(
            ClientIdType.AEST,
            to.path,
          );
          switch (status) {
            case AuthStatus.Continue:
              next();
              break;
            case AuthStatus.RequiredLogin:
              next({
                name: AESTRoutesConst.LOGIN,
              });
              break;
            case AuthStatus.RedirectHome:
              next({
                name: AESTRoutesConst.AEST_DASHBOARD,
              });
              break;
            default:
              next({
                name: SharedRouteConst.FORBIDDEN_USER,
              });
          }
        })
        .catch((error: unknown) => {
          console.error(error);
          throw error;
        });
    },
  },
];
