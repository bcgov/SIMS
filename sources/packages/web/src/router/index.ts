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
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Define error handling on router error.
router.onError((error: unknown) => {
  console.error(error);
  throw error;
});

router.beforeEach((to, from, next) => {
  if (to.meta?.clientType === ClientIdType.Institution) {
    validateInstitutionUserAccess(to, from, next);
  } else {
    next();
  }
});

export default router;
