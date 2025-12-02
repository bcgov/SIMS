import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  RouteLocationNormalized,
} from "vue-router";
import { studentRoutes } from "./StudentRoutes";
import { institutionRoutes } from "./InstitutionRoutes";
import { aestRoutes } from "./AESTRoutes";
import { sharedRoutes } from "./SharedRoutes";
import { ClientIdType } from "../types/contracts/ConfigContract";
import { supportingUsersRoutes } from "./SupportingUserRoutes";
import { validateInstitutionUserAccess } from "./InstitutionRouteHelper";
import { InstitutionUserTypes } from "@/types";
import { AppConfigService } from "@/services/AppConfigService";
import { SharedRouteConst } from "@/constants/routes/RouteConstants";

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

/**
 * Encapsulates maintenance mode checks for a given route and app config.
 * @param to The route to check for maintenance mode.
 * @returns True if the route should be redirected to the maintenance page, otherwise false.
 */
async function isMaintenanceActiveForRoute(
  to: RouteLocationNormalized,
): Promise<boolean> {
  const config = await AppConfigService.shared.config();

  // Do not apply maintenance checks to the maintenance page itself.
  if (to.name === SharedRouteConst.MAINTENANCE_PAGE) {
    return false;
  }

  // Global maintenance mode check.
  if (config.maintenanceMode) {
    return true;
  }

  const clientType = to.meta?.clientType;
  switch (clientType) {
    case ClientIdType.Student:
      return !!config.maintenanceModeStudent;
    case ClientIdType.Institution:
      return !!config.maintenanceModeInstitution;
    case ClientIdType.AEST:
      return !!config.maintenanceModeMinistry;
    case ClientIdType.SupportingUsers:
      return !!config.maintenanceModeSupportingUser;
    case ClientIdType.External:
      return !!config.maintenanceModeExternal;
    default:
      return false;
  }
}

// TODO: As per vue documentation, usage of next is discouraged.
// when vue-router version is upgraded, usage of next must be replaced
// with returning either true or route location.
// When tried to return true or route location instead of next with the current version of vue-router
// results in router not working as expected on page refresh.
router.beforeResolve(async (to, _from, next) => {
  // Use centralized helper to decide if this route should go to maintenance.
  if (await isMaintenanceActiveForRoute(to)) {
    next({ name: SharedRouteConst.MAINTENANCE_PAGE });
    return;
  }

  if (to.meta?.clientType === ClientIdType.Institution) {
    await validateInstitutionUserAccess(to, _from, next);
  }

  next();
});

export default router;
