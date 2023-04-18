import {
  InstitutionRoutesConst,
  SharedRouteConst,
} from "@/constants/routes/RouteConstants";
import { AuthService } from "@/services/AuthService";
import store from "@/store";
import {
  ClientIdType,
  InstitutionUserAuthRolesAndLocation,
  InstitutionUserRoles,
  InstitutionUserTypes,
  UserStateForStore,
} from "@/types";
import { RouteLocationNormalized, NavigationGuardNext } from "vue-router";

interface InstitutionRouteParams {
  locationId?: string;
}

export async function validateInstitutionUserAccess(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): Promise<void> {
  if (to.meta.requiresAuth === false) {
    next();
    return;
  }

  await AuthService.shared.initialize(ClientIdType.Institution);

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
}

function isInstitutionUserAllowed(to: RouteLocationNormalized): boolean {
  const institutionUserDetails = store.getters[
    "institution/myDetails"
  ] as UserStateForStore;

  console.log(institutionUserDetails);

  // If the user is identified to be a business bceid user
  // who's institution and the user themselves not exist in sims
  // then it is assumed that user has logged in to setup the institution
  // and the route is valid.
  // At this moment user is not an active sims user.
  if (
    institutionUserDetails.isInstitutionSetupUser &&
    to.name === InstitutionRoutesConst.INSTITUTION_CREATE
  ) {
    return true;
  }

  // Beyond this, the user must be an active SIMS user.
  if (!institutionUserDetails.isActive) {
    return false;
  }

  // If user types are not specified in the route, it is not valid.
  if (!to.meta.institutionUserTypes?.length) {
    return false;
  }

  // TODO: Validate the route for BCPublic institutions must be done here.

  // If the user is institution admin, then they have access to all routes.
  const isInstitutionAdmin: boolean = institutionUserDetails?.isAdmin;

  const authorizations = store.getters["institution/myAuthorizationDetails"]
    .authorizations as InstitutionUserAuthRolesAndLocation[];

  console.log(authorizations);

  if (isInstitutionAdmin) {
    // If the route is permitted for only institution admin who is legal signing authority
    // then validate the user role.
    if (to.meta?.allowOnlyLegalSigningAuthority) {
      return authorizations.some(
        (auth) => auth.userRole === InstitutionUserRoles.legalSigningAuthority,
      );
    }
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
  return authorizations.some(
    (authorization) => authorization.locationId === +locationId,
  );
}
