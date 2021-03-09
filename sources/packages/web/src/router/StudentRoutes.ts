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
import { studentRoutesConst } from "../constants/routes/RouteConstants";

export const studentRoutes: Array<RouteRecordRaw> = [
  {
    path: "/student",
    name: studentRoutesConst.APP_STUDENT,
    component: AppStudent,
    children: [
      {
        path: "student-dashboard",
        name: studentRoutesConst.STUDENT_DASHBOARD,
        component: StudentDashboard,
      },
      {
        path: "login",
        name: studentRoutesConst.LOGIN,
        component: Login,
      },
      {
        path: "student-profile",
        name: studentRoutesConst.STUDENT_PROFILE,
        component: Student,
        props: { editMode: false },
      },
      {
        path: "student-profile/edit",
        name: studentRoutesConst.STUDENT_PROFILE_EDIT,
        component: Student,
      },
      {
        path: "application",
        name: studentRoutesConst.FINANCIAL_AID_APPLICATION,
        component: FinancialAidApplication,
        children: [
          {
            path: "personal-info",
            name: studentRoutesConst.PERSONAL_INFO,
            component: PersonalInfoQuestionnaire,
          },
          {
            path: "select-program",
            name: studentRoutesConst.SELECT_PROGRAM,
            component: SelectProgram,
          },
          {
            path: "financial-info",
            name: studentRoutesConst.FINANCIAL_INFO,
            component: FinancialInfo,
          },
          {
            path: "confirm-submission",
            name: studentRoutesConst.CONFIRM_SUBMISSION,
            component: ConfirmSubmission,
          },
        ], //Children under /Student/FinancialAidApplication
      },
    ], //Children under /Student
  },
];
