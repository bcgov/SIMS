import { RouteRecordRaw } from "vue-router";
import StudentDashboard from "@/views/student/StudentDashboard.vue";
import Login from "@/views/student/Login.vue";
import AppStudent from "@/views/student/AppStudent.vue";
import DynamicStudentApp from "@/views/student/financial-aid-application/FullTimeApplication.vue";
import StudentApplication from "@/views/student/financial-aid-application/StudentApplication.vue";
import Assessment from "@/views/student/NoticeOfAssessment.vue";
import StudentProfile from "@/views/student/StudentProfile.vue";
import Notifications from "@/views/student/Notifications.vue";
import StudentFileUploader from "@/views/student/StudentFileUploader.vue";
import NotificationsSettings from "@/views/student/NotificationsSettings.vue";
import StudentApplicationSummary from "@/views/student/StudentApplicationSummary.vue";
import StudentApplicationDetails from "@/views/student/StudentApplicationDetails.vue";
import StudentRequestChange from "@/views/student/StudentRequestChange.vue";

import {
  StudentRoutesConst,
  SharedRouteConst,
} from "../constants/routes/RouteConstants";
import { AppRoutes, AuthStatus } from "../types";
import { ClientIdType } from "../types/contracts/ConfigContract";
import { RouteHelper } from "@/helpers";
import { AuthService } from "@/services/AuthService";

export const studentRoutes: Array<RouteRecordRaw> = [
  {
    path: AppRoutes.StudentRoot,
    name: StudentRoutesConst.APP_STUDENT,
    component: AppStudent,
    children: [
      {
        path: AppRoutes.StudentDashboard,
        name: StudentRoutesConst.STUDENT_DASHBOARD,
        component: StudentDashboard,
        meta: {
          clientType: ClientIdType.Student,
        },
      },
      {
        path: AppRoutes.Login,
        name: StudentRoutesConst.LOGIN,
        component: Login,
        meta: {
          requiresAuth: false,
          clientType: ClientIdType.Student,
        },
      },
      {
        path: "student-profile",
        name: StudentRoutesConst.STUDENT_PROFILE,
        component: StudentProfile,
        props: { editMode: false },
        meta: {
          clientType: ClientIdType.Student,
        },
      },
      {
        path: "student-profile/edit",
        name: StudentRoutesConst.STUDENT_PROFILE_EDIT,
        component: StudentProfile,
        meta: {
          clientType: ClientIdType.Student,
        },
      },
      {
        path: AppRoutes.StartStudentApplication,
        name: StudentRoutesConst.STUDENT_APPLICATION_FORM,
        component: StudentApplication,
        meta: {
          clientType: ClientIdType.Student,
        },
      },
      {
        path: AppRoutes.StudentApplication,
        name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
        component: DynamicStudentApp,
        props: true,
        meta: {
          clientType: ClientIdType.Student,
        },
      },
      {
        path: AppRoutes.StudentApplicationView,
        name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM_VIEW,
        component: DynamicStudentApp,
        props: true,
        meta: {
          clientType: ClientIdType.Student,
        },
      },
      {
        path: AppRoutes.Assessment,
        name: StudentRoutesConst.ASSESSMENT,
        component: Assessment,
        props: true,
        meta: {
          clientType: ClientIdType.Student,
        },
      },
      {
        path: "notifications",
        name: StudentRoutesConst.NOTIFICATIONS,
        component: Notifications,
        meta: {
          clientType: ClientIdType.Student,
        },
      },
      {
        path: AppRoutes.StudentFileUploader,
        name: StudentRoutesConst.STUDENT_FILE_UPLOADER,
        component: StudentFileUploader,
        meta: {
          clientType: ClientIdType.Student,
        },
      },
      {
        path: "notifications/settings",
        name: StudentRoutesConst.NOTIFICATIONS_SETTINGS,
        component: NotificationsSettings,
        meta: {
          clientType: ClientIdType.Student,
        },
      },
      {
        path: AppRoutes.StudentApplicationSummary,
        name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
        component: StudentApplicationSummary,
        meta: {
          clientType: ClientIdType.Student,
        },
      },
      {
        path: AppRoutes.StudentApplicationDetails,
        name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
        component: StudentApplicationDetails,
        props: true,
        meta: {
          clientType: ClientIdType.Student,
        },
      },
      {
        path: AppRoutes.RequestChange,
        name: StudentRoutesConst.STUDENT_REQUEST_CHANGE,
        component: StudentRequestChange,
        meta: {
          clientType: ClientIdType.Student,
        },
      },
    ], //Children under /Student
    beforeEnter: (to, _from, next) => {
      AuthService.shared
        .initialize(ClientIdType.Student)
        .then(() => {
          const status = RouteHelper.getNavigationAuthStatus(
            ClientIdType.Student,
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
          }
        })
        .catch(e => {
          console.error(e);
          throw e;
        });
    },
  },
];
