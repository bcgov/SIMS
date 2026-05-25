import {
  InstitutionRoutesConst,
  SharedRouteConst,
} from "@/constants/routes/RouteConstants";
import { AuthService } from "@/services/AuthService";
import store from "@/store";
import { ClientIdType } from "@/types";
import { useInstitutionAuth } from "@/composables";
import { RouteLocationNormalized, NavigationGuardNext } from "vue-router";
/**
 * Institution route params.
 */
interface InstitutionRouteParams {
  locationId?: string;
}

/**
 * Validate the access of user to the given route.
 * @param to the route where user is navigated to.
 * @param _from the route where user is navigated from.
 * @param next navigation guard.
 */
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

/**
 * Validate the access of authenticated user to the given route.
 * @param to the route where user is navigated to.
 * @returns if the user has access to the route.
 */
function isInstitutionUserAllowed(to: RouteLocationNormalized): boolean {
  const {
    isInstitutionSetupUser,
    isAdmin,
    isLegalSigningAuthority,
    userType,
    isBCPublic,
    hasLocationAccess,
  } = useInstitutionAuth(store);

  // If the user is identified to be a business bceid user
  // who's institution and the user themselves not exist in sims
  // then it is assumed that user has logged in to setup the institution
  // and the route is valid.
  // At this moment user is not an active sims user.
  if (
    isInstitutionSetupUser.value &&
    to.name === InstitutionRoutesConst.INSTITUTION_CREATE
  ) {
    return true;
  }

  const userTypes = to.meta.institutionUserTypes;

  // If user types are not specified in the route, it is not valid.
  if (!userTypes?.length) {
    return false;
  }

  // If the route is suppose to be accessible only for BC Public institutions
  // reject the access for other institution types.
  if (to.meta.allowOnlyBCPublic && !isBCPublic.value) {
    return false;
  }

  // If the user is institution admin, then they have access to all routes
  // except the routes which are accessible only for legal signing authority.
  if (isAdmin.value) {
    // Validate the legal signing authority user role.
    if (to.meta?.allowOnlyLegalSigningAuthority) {
      return isLegalSigningAuthority.value;
    }
    return true;
  }

  // If the user is non admin and the route allows non admin users, then check if the user has access
  // to the location present in route params if location exist in route params.
  const routParams: InstitutionRouteParams = to.params;

  // When location is not in route params the route is resolved and user is assumed to have access.
  const locationId = routParams?.locationId;
  if (!locationId) {
    return true;
  }

  // If the user is not an admin, check if user type is among the allowed route user types.
  if (!userTypes.includes(userType(+locationId))) {
    return false;
  }

  // when the location is present in route params, check if the user has access.
  return hasLocationAccess(+locationId);
}
