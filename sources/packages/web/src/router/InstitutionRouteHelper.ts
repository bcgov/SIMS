import {
  InstitutionRoutesConst,
  SharedRouteConst,
} from "@/constants/routes/RouteConstants";
import { AuthService } from "@/services/AuthService";
import store from "@/store";
import {
  ClientIdType,
  InstitutionUserAuthRolesAndLocation,
  InstitutionUserTypes,
  UserStateForStore,
} from "@/types";
import { RouteLocationNormalized, NavigationGuardNext } from "vue-router";

interface InstitutionRouteParams {
  locationId?: string;
}

export function validateInstitutionUserAccess(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): void {
  if (to.meta.requiresAuth === false) {
    next();
    return;
  }
  AuthService.shared.initialize(ClientIdType.Institution).then(() => {
    if (AuthService.shared.keycloak?.authenticated) {
      if (isInstitutionUserAllowed(to)) {
        next();
        return;
      }
      // Institution user is not allowed to access this route.
      next({
        name: SharedRouteConst.FORBIDDEN_USER,
      });
    } else {
      next({
        name: InstitutionRoutesConst.LOGIN,
      });
    }
  });
}

function isInstitutionUserAllowed(to: RouteLocationNormalized): boolean {
  const institutionUserDetails = store.getters[
    "institution/myDetails"
  ] as UserStateForStore;

  // If the user is identified to be a business bceid user
  // who's institution and the user themselves not exist in sims
  // then it is assumed that user has logged in to setup the institution
  // and the route is valid.
  if (institutionUserDetails.isInstitutionSetupUser) {
    return true;
  }
  // If user types are not specified in the route, it is not valid.
  if (!to.meta.institutionUserTypes?.length) {
    return false;
  }

  // TODO: Validate the route for BCPublic institutions must be done here.

  // If the user is institution admin, then they have access to all routes.
  const isInstitutionAdmin: boolean = institutionUserDetails?.isAdmin;

  if (isInstitutionAdmin) {
    return true;
  }

  // If the user is not an admin, check if the route is allowed for non admin user.
  const userTypes = to.meta.institutionUserTypes;
  if (!userTypes.includes(InstitutionUserTypes.user)) {
    return false;
  }

  // If the user is non admin and the route allows non admin users, then check if the user has access
  // to the location present in route params if location exist in route params.
  const routParams: InstitutionRouteParams = to.params;

  // When location is not in route params the route is resolved and user is assumed to have access.
  const locationId = routParams?.locationId;
  if (!locationId) {
    return true;
  }

  // when the location is present in route params, check if the user has access.
  const authorizations = store.getters["institution/myAuthorizationDetails"]
    .authorizations as InstitutionUserAuthRolesAndLocation[];

  return authorizations.some(
    (authorization) => authorization.locationId === +locationId,
  );
}
