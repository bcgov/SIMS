import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Login from "../views/Login.vue";
import User from "../views/User.vue";
import UserAsFunc from "../views/UserAsFunc.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Login",
    component: Login
  },
  {
    path: "/User",
    name: "User",
    component: User
  },
  {
    path: "/UserAsFunc",
    name: "UserAsFunc",
    component: UserAsFunc
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
