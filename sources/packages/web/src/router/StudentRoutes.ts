import { RouteRecordRaw } from "vue-router";
import StudentDashboard from "../views/student/StudentDashboard.vue";
import Login from "../views/student/Login.vue";
import Student from "../views/student/Student.vue";
import AppStudent from "../views/student/AppStudent.vue";
import FinancialAidApplication from "../views/student/financial-aid-application/FinancialAidApplication.vue";
import PersonalInfoQuestionnaire from "../views/student/financial-aid-application/PersonalInfoQuestionnaire.vue";
import SelectProgram from "../views/student/financial-aid-application/SelectProgram.vue";
import FinancialInfo from "../views/student/financial-aid-application/FinancialInfo.vue";
import ConfirmSubmission from "../views/student/financial-aid-application/ConfirmSubmission.vue";
import DynamicStudentApp from "../views/student/DynamicStudentApp.vue";
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
      },
      {
        path: "login",
        name: StudentRoutesConst.LOGIN,
        component: Login,
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
        component: Student,
        props: { editMode: false },
      },
      {
        path: "student-profile/edit",
        name: StudentRoutesConst.STUDENT_PROFILE_EDIT,
        component: Student,
      },
      {
        path: "dynamic-application-form",
        name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
        component: DynamicStudentApp,
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
          },
          {
            path: "select-program",
            name: StudentRoutesConst.SELECT_PROGRAM,
            component: SelectProgram,
          },
          {
            path: "financial-info",
            name: StudentRoutesConst.FINANCIAL_INFO,
            component: FinancialInfo,
          },
          {
            path: "confirm-submission",
            name: StudentRoutesConst.CONFIRM_SUBMISSION,
            component: ConfirmSubmission,
          },
        ], //Children under /Student/FinancialAidApplication
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
