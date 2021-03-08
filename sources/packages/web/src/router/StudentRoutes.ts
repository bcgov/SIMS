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

export const studentRoutes: Array<RouteRecordRaw> = [
  {
    path: "/student",
    name: "AppStudent",
    component: AppStudent,
    children: [
      {
        path: "student-dashboard",
        name: "StudentDashboard",
        component: StudentDashboard,
      },
      {
        path: "login",
        name: "Login",
        component: Login,
      },
      {
        path: "student-profile",
        name: "Student-Profile",
        component: Student,
        props: { editMode: false },
      },
      {
        path: "student-profile/edit",
        name: "Student-Profile-Edit",
        component: Student,
      },
      {
        path: "application",
        name: "application",
        component: FinancialAidApplication,
        children: [
          {
            path: "personal-info",
            name: "personal-info",
            component: PersonalInfoQuestionnaire,
          },
          {
            path: "select-program",
            name: "select-program",
            component: SelectProgram,
          },
          {
            path: "financial-info",
            name: "financial-info",
            component: FinancialInfo,
          },
          {
            path: "confirm-submission",
            name: "confirm-submission",
            component: ConfirmSubmission,
          },
        ], //Children under /Student/FinancialAidApplication
      },
    ], //Children under /Student
  },
];
