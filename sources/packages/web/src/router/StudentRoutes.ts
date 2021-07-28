import { RouteRecordRaw } from "vue-router";
import StudentDashboard from "../views/student/StudentDashboard.vue";
import Login from "../views/student/Login.vue";
import AppStudent from "../views/student/AppStudent.vue";
import FinancialAidApplication from "../views/student/financial-aid-application/FinancialAidApplication.vue";
import PersonalInfoQuestionnaire from "../views/student/financial-aid-application/PersonalInfoQuestionnaire.vue";
import SelectProgram from "../views/student/financial-aid-application/SelectProgram.vue";
import FinancialInfo from "../views/student/financial-aid-application/FinancialInfo.vue";
import ConfirmSubmission from "../views/student/financial-aid-application/ConfirmSubmission.vue";
import DynamicStudentApp from "../views/student/financial-aid-application/FullTimeApplication.vue";
import Assessment from "../views/student/NoticeOfAssessment.vue";
import StudentProfile from "../views/student/StudentProfile.vue";
import Notifications from "../views/student/Notifications.vue";
import NotificationsSettings from "../views/student/NotificationsSettings.vue";
import StudentApplicationSummary from "@/views/student/StudentApplicationSummary.vue";
import StudentEditApplication from "@/views/student/StudentEditApplication.vue";

import {
  StudentRoutesConst,
  SharedRouteConst,
} from "../constants/routes/RouteConstants";
import { AppConfigService } from "../services/AppConfigService";
import { AppRoutes, AuthStatus } from "../types";
import { ClientIdType } from "../types/contracts/ConfigContract";

export const studentRoutes: Array<RouteRecordRaw> = [
  {
    path: AppRoutes.StudentRoot,
    name: StudentRoutesConst.APP_STUDENT,
    component: AppStudent,
    children: [
      {
        path: "student-dashboard",
        name: StudentRoutesConst.STUDENT_DASHBOARD,
        component: StudentDashboard,
        meta: {
          clientType: ClientIdType.STUDENT,
        },
      },
      {
        path: "login",
        name: StudentRoutesConst.LOGIN,
        component: Login,
        meta: {
          requiresAuth: false,
          clientType: ClientIdType.STUDENT,
        },
        beforeEnter: (to, from, next) => {
          // Check Auth service is available or not
          if (AppConfigService.shared.authService) {
            const auth =
              AppConfigService.shared.authService?.authenticated || false;
            if (!auth) {
              // Allowing to load login iff when user is not authenticated
              next();
            } else {
              next({
                name: StudentRoutesConst.STUDENT_DASHBOARD,
              });
            }
          } else {
            // Auth service is not initialize so loading to student root
            next({
              name: StudentRoutesConst.APP_STUDENT,
            });
          }
        },
      },
      {
        path: "student-profile",
        name: StudentRoutesConst.STUDENT_PROFILE,
        component: StudentProfile,
        props: { editMode: false },
        meta: {
          clientType: ClientIdType.STUDENT,
        },
      },
      {
        path: "student-profile/edit",
        name: StudentRoutesConst.STUDENT_PROFILE_EDIT,
        component: StudentProfile,
        meta: {
          clientType: ClientIdType.STUDENT,
        },
      },
      {
        path: AppRoutes.StudentApplication,
        name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
        component: DynamicStudentApp,
        props: true,
        meta: {
          clientType: ClientIdType.STUDENT,
        },
      },
      {
        path: AppRoutes.Assessment,
        name: StudentRoutesConst.ASSESSMENT,
        component: Assessment,
        props: true,
        meta: {
          clientType: ClientIdType.STUDENT,
        },
      },
      {
        path: "notifications",
        name: StudentRoutesConst.NOTIFICATIONS,
        component: Notifications,
        meta: {
          clientType: ClientIdType.STUDENT,
        },
      },
      {
        path: "notifications/settings",
        name: StudentRoutesConst.NOTIFICATIONS_SETTINGS,
        component: NotificationsSettings,
        meta: {
          clientType: ClientIdType.STUDENT,
        },
      },
      {
        path: "application",
        name: StudentRoutesConst.FINANCIAL_AID_APPLICATION,
        component: FinancialAidApplication,
        children: [
          {
            path: "personal-info",
            name: StudentRoutesConst.PERSONAL_INFO,
            component: PersonalInfoQuestionnaire,
            meta: {
              clientType: ClientIdType.STUDENT,
            },
          },
          {
            path: "select-program",
            name: StudentRoutesConst.SELECT_PROGRAM,
            component: SelectProgram,
            meta: {
              clientType: ClientIdType.STUDENT,
            },
          },
          {
            path: "financial-info",
            name: StudentRoutesConst.FINANCIAL_INFO,
            component: FinancialInfo,
            meta: {
              clientType: ClientIdType.STUDENT,
            },
          },
          {
            path: "confirm-submission",
            name: StudentRoutesConst.CONFIRM_SUBMISSION,
            component: ConfirmSubmission,
            meta: {
              clientType: ClientIdType.STUDENT,
            },
          },
        ], //Children under /Student/FinancialAidApplication
      },
      {
        path: AppRoutes.StudentApplicationSummary,
        name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
        component: StudentApplicationSummary,
        meta: {
          clientType: ClientIdType.STUDENT,
        },
      },
      {
        path: AppRoutes.StudentEditApplication,
        name: StudentRoutesConst.STUDENT_EDIT_APPLICATION,
        component: StudentEditApplication,
        meta: {
          clientType: ClientIdType.STUDENT,
        },
      },
    ], //Children under /Student
    beforeEnter: (to, from, next) => {
      AppConfigService.shared
        .initAuthService(ClientIdType.STUDENT)
        .then(() => {
          const status = AppConfigService.shared.authStatus({
            type: ClientIdType.STUDENT,
            path: to.path,
          });
          switch (status) {
            case AuthStatus.Continue:
              next();
              break;
            case AuthStatus.RequiredLogin:
              next({
                name: StudentRoutesConst.LOGIN,
              });
              break;
            case AuthStatus.RedirectHome:
              next({
                name: StudentRoutesConst.STUDENT_DASHBOARD,
              });
              break;
            case AuthStatus.ForbiddenUser:
              next({
                name: SharedRouteConst.FORBIDDEN_USER,
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
