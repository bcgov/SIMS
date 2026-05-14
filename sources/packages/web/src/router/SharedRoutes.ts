import { SharedRouteConst } from "../constants/routes/RouteConstants";
import { RouteRecordRaw } from "vue-router";
import PageNotFound from "../views/PageNotFound.vue";
import ForbiddenUser from "../views/ForbiddenUser.vue";
import LandingPage from "../views/LandingPage.vue";
import { AppRoutes } from "../types";
import MaintenancePage from "@/views/MaintenancePage.vue";

export const sharedRoutes: Array<RouteRecordRaw> = [
  {
    path: AppRoutes.LandingPage,
    name: SharedRouteConst.LANDING_PAGE,
    component: LandingPage,
  },
  {
    path: "/:pathMatch(.*)*",
    name: SharedRouteConst.PAGE_NOT_FOUND,
    component: PageNotFound,
  },
  {
    path: AppRoutes.ForbiddenUser,
    name: SharedRouteConst.FORBIDDEN_USER,
    component: ForbiddenUser,
  },
  {
    path: AppRoutes.MaintenancePage,
    name: SharedRouteConst.MAINTENANCE_PAGE,
    component: MaintenancePage,
  },
];
