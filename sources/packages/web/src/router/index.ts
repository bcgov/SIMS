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

function forEachInstitutionRoutes(
  to: any,
  from: any,
  next: any,
  clientType: ClientIdType,
) {
  // MANAGE INSTITUTION ROUTES
  AppConfigService.shared
    .initAuthService(clientType)
    .then(() => {
      if (to.meta.requiresAuth !== false) {
        if (AppConfigService.shared?.authService?.authenticated) {
          if (to.meta?.userTypes || to.meta?.checkAllowedLocation) {
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
    })
    .catch(e => {
      console.error(e);
      throw e;
    });
}

router.beforeEach((to, from, next) => {
  if (to.meta?.clientType === ClientIdType.INSTITUTION)
    forEachInstitutionRoutes(to, from, next, ClientIdType.INSTITUTION);
  else next();
});

export default router;
