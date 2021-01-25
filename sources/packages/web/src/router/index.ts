import { AppConfigService } from "@/services/AppConfigService";
import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
import User from "../views/User.vue";
import UserAsFunc from "../views/UserAsFunc.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: Home
  },
  {
    path: "/login",
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
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach(async () => {
  // Check Config
  if (!AppConfigService.shared.isConfigReady()) {
    console.log("Router: Setting up config and auth");
    await AppConfigService.shared.init();
  }
  return true;
});

export default router;
