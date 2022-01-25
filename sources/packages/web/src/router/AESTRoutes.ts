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
import Programs from "@/views/aest/institution/Programs.vue";
import Locations from "@/views/aest/institution/Locations.vue";
import Users from "@/views/aest/institution/Users.vue";
import Designation from "@/views/aest/institution/Designation.vue";
import Restrictions from "@/views/aest/institution/Restrictions.vue";
import InstitutionNotes from "@/views/aest/institution/InstitutionNotes.vue";
import ApplicationDetails from "@/views/aest/ApplicationDetails.vue";
import AESTHomeSideBar from "@/components/layouts/aest/AESTHomeSideBar.vue";
import StudentNotes from "@/views/aest/student/StudentNotes.vue";
import StudentRestrictions from "@/views/aest/student/StudentRestrictions.vue";
import {
  AESTRoutesConst,
  SharedRouteConst,
} from "@/constants/routes/RouteConstants";
import { AppRoutes, AuthStatus } from "@/types";
import { ClientIdType } from "@/types/contracts/ConfigContract";
import { RouteHelper } from "@/helpers";
import { AuthService } from "@/services/AuthService";
import LocationProgramAddEdit from "@/views/institution/locations/programs/LocationProgramAddEdit.vue";

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
            path: AppRoutes.Profile,
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
            path: AppRoutes.Notes,
            name: AESTRoutesConst.STUDENT_NOTES,
            props: true,
            component: StudentNotes,
            meta: {
              clientType: ClientIdType.AEST,
            },
          },
        ],
      },
      {
        path: AppRoutes.ApplicationDetail,
        name: AESTRoutesConst.APPLICATION_DETAILS,
        props: true,
        components: {
          default: ApplicationDetails,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
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
        path: AppRoutes.ViewPrograms,
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
            path: AppRoutes.Profile,
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
        .catch(e => {
          console.error(e);
          throw e;
        });
    },
  },
];
