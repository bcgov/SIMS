import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
import Student from "../views/Student.vue";
import FAApplication from "../views/FAApplication.vue";
import PageNotFound from "../views/PageNotFound.vue";

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
