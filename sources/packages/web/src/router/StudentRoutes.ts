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
import { routeConstants } from "../constants/routes/RouteConstants";

export const studentRoutes: Array<RouteRecordRaw> = [
  {
    path: "/student",
    name: routeConstants.APPSTUDENT,
    component: AppStudent,
    children: [
      {
        path: "student-dashboard",
        name: routeConstants.STUDENTDASHBOARD,
        component: StudentDashboard,
      },
      {
        path: "login",
        name: routeConstants.LOGIN,
        component: Login,
      },
      {
        path: "student-profile",
        name: routeConstants.STUDENTPROFILE,
        component: Student,
        props: { editMode: false },
      },
      {
        path: "student-profile/edit",
        name: routeConstants.STUDENTPROFILEEDIT,
        component: Student,
      },
      {
        path: "application",
        name: routeConstants.FINANCIALAIDAPPLICATION,
        component: FinancialAidApplication,
        children: [
          {
            path: "personal-info",
            name: routeConstants.PERSONALINFO,
            component: PersonalInfoQuestionnaire,
          },
          {
            path: "select-program",
            name: routeConstants.SELECTPROGRAM,
            component: SelectProgram,
          },
          {
            path: "financial-info",
            name: routeConstants.FINANCIALINFO,
            component: FinancialInfo,
          },
          {
            path: "confirm-submission",
            name: routeConstants.CONFIRMSUBMISSION,
            component: ConfirmSubmission,
          },
        ], //Children under /Student/FinancialAidApplication
      },
    ], //Children under /Student
  },
];
