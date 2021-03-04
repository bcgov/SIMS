import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Home from "../views/student/Home.vue";
import Login from "../views/student/Login.vue";
import Student from "../views/student/Student.vue";
import FAApplication from "../views/student/financial-aid-application/FAApplication.vue";
import PageNotFound from "../views/PageNotFound.vue";
import PersonalInfoQuestionnaire from "../views/student/financial-aid-application/PersonalInfoQuestionnaire.vue";
import SelectProgram from "../views/student/financial-aid-application/SelectProgram.vue";
import FinancialInfo from "../views/student/financial-aid-application/FinancialInfo.vue";
import ConfirmSubmission from "../views/student/financial-aid-application/ConfirmSubmission.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/student-profile",
    name: "Student-Profile",
    component: Student,
    props: { editMode: false },
  },
  {
    path: "/student-profile/edit",
    name: "Student-Profile-Edit",
    component: Student,
  },
  {
    path: "/application",
    name: "application",
    component: FAApplication,
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
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    component: PageNotFound,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
