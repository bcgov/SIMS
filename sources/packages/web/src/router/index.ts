import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { studentRoutes } from "./StudentRoutes";
import { institutionRoutes } from "./InstitutionRoutes";
import { aestRoutes } from "./AESTRoutes";
import { sharedRoutes } from "./SharedRoutes";
import { ClientIdType } from "../types/contracts/ConfigContract";
import { supportingUsersRoutes } from "./SupportingUserRoutes";
import { validateInstitutionUserAccess } from "./InstitutionRouteHelper";
import { InstitutionUserTypes } from "@/types";

declare module "vue-router" {
  /**
   * Route meta properties.
   */
  interface RouteMeta {
    clientType: ClientIdType;
    requiresAuth?: boolean;
    institutionUserTypes?: InstitutionUserTypes[];
    allowOnlyLegalSigningAuthority?: boolean;
    allowOnlyBCPublic?: boolean;
  }
}

const routes: Array<RouteRecordRaw> = [
  ...studentRoutes,
  ...institutionRoutes,
  ...aestRoutes,
  ...sharedRoutes,
  ...supportingUsersRoutes,
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// TODO: As per vue documentation, usage of next is discouraged.
// when vue-router version is upgraded, usage of next must be replaced
// with returning either true or route location.
// When tried to return true or route location instead of next with current version of vue-router
// results in router not working as expected on page refresh.
router.beforeResolve(async (to, _from, next) => {
  if (to.meta?.clientType === ClientIdType.Institution) {
    await validateInstitutionUserAccess(to, _from, next);
  } else {
    next();
  }
});

export default router;
