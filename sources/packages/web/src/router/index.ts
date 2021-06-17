import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { studentRoutes } from "./StudentRoutes";
import { institutionRoutes } from "./InstitutionRoutes";
import { sharedRoutes } from "./SharedRoutes";
import { AppConfigService } from "../services/AppConfigService";
import {
  InstitutionRoutesConst,
  SharedRouteConst,
} from "../constants/routes/RouteConstants";
import { UserAuthorizationService } from "@/services/UserAuthorizationService";
import { ClientIdType } from "../types/contracts/ConfigContract";

const routes: Array<RouteRecordRaw> = [
  ...studentRoutes,
  ...institutionRoutes,
  ...sharedRoutes,
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth !== false) {
    if (AppConfigService.shared.authService) {
      // MANAGE INSTITUTION ROUTES
      if (
        to.meta?.clientType === ClientIdType.INSTITUTION &&
        to.meta?.userTypes
      ) {
        if (
          UserAuthorizationService.shared.isUserTypeAllowed(
            to.meta.userTypes,
            to.params,
            to.meta.checkAllowedLocation,
          )
        ) {
          next();
        } else {
          // UNAUTHORIZED USER
          next({
            name: SharedRouteConst.FORBIDDEN_USER,
          });
        }
      } else {
        next();
      }
    } else {
      next({
        name: InstitutionRoutesConst.LOGIN,
      });
    }
  } else {
    next();
  }
});

export default router;
