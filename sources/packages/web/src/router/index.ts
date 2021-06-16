import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { studentRoutes } from "./StudentRoutes";
import { institutionRoutes } from "./InstitutionRoutes";
import { sharedRoutes } from "./SharedRoutes";
import { AppConfigService } from "../services/AppConfigService";
import { InstitutionRoutesConst } from "../constants/routes/RouteConstants";
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
  console.log(to, "---to");
  console.log(from, "---from");
  console.log(next, "---next");
  console.log(to.meta?.userTypes,'++++++++++++++++to.meta?.userTypes')
  const isAuthenticated = AppConfigService.shared.authService ?? false;
  if (to.meta.requiresAuth) {
    if (isAuthenticated) {
      if (to.meta?.clientType === ClientIdType.INSTITUTION) {
        if (to.meta?.userTypes) {
          if (
            UserAuthorizationService.shared.isUserTypeAllowed(
              to.meta.userTypes,
              to.params,
            )
          ) {
            next();
          }
        } else {
          next();
        }
      } else {
        // all router other than ClientIdType.INSTITUTION comes here
        next();
      }
    } else {
      // TODO-LOGIC TO LOGOUT, IF REQUIRED
      // REMOVE BELOW LOGIN CODE-ADD APPROPRIATE NAME-
      // (IF SOMEONE IS AUTHENTICATED AS STUDENT
      // AND TRIED TO GO TO ANY INSTITUTION OR MINISTRY URL, ->
      // ADDRESS THAT SCENARIO- MAY BE ADD A FORBIDEN PAGE)
      next({
        name: InstitutionRoutesConst.LOGIN,
      });
    }
  } else {
    next();
  }
});

export default router;
