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
import { StudentRoutesConst } from "../constants/routes/RouteConstants";
import { AppConfigService } from "@/services/AppConfigService";

export const studentRoutes: Array<RouteRecordRaw> = [
  {
    path: "/student",
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
          if (!AppConfigService.shared.authService?.authenticated) {
            next()
          } else {
            next({
              name: StudentRoutesConst.STUDENT_DASHBOARD
            })
          }
        }
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
  },
];
