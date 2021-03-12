import { SharedRouteConst } from "../constants/routes/RouteConstants";
import { RouteRecordRaw } from "vue-router";
import PageNotFound from "../views/PageNotFound.vue";
import ForbiddenUser from "../views/ForbiddenUser.vue";
import { AppRoutes } from "../types";

export const sharedRoutes: Array<RouteRecordRaw> = [
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
];
