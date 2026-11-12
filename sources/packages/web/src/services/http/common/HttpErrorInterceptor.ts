import { HttpStatusCode, isAxiosError } from "axios";
import { Router } from "vue-router";
import HttpClient from "./HttpClient";
import { AuthService } from "@/services/AuthService";
import { ClientIdType } from "@/types/contracts/ConfigContract";
import { MAINTENANCE_MODE } from "@/constants/error-code.constants";
import {
  AESTRoutesConst,
  InstitutionRoutesConst,
  SharedRouteConst,
  StudentRoutesConst,
  SupportingUserRoutesConst,
} from "@/constants/routes/RouteConstants";

const SHARED_ERROR_ROUTES = new Set<unknown>([
  SharedRouteConst.PAGE_NOT_FOUND,
  SharedRouteConst.FORBIDDEN_USER,
  SharedRouteConst.MAINTENANCE_PAGE,
  SharedRouteConst.UNEXPECTED_ERROR,
]);

/**
 * Gets the login route of the client type currently authenticated.
 * @returns login route name, if the client type is known.
 */
function getLoginRouteName(): symbol | undefined {
  switch (AuthService.shared.authClientType) {
    case ClientIdType.Student:
      return StudentRoutesConst.LOGIN;
    case ClientIdType.Institution:
      return InstitutionRoutesConst.LOGIN;
    case ClientIdType.AEST:
      return AESTRoutesConst.LOGIN;
    case ClientIdType.SupportingUsers:
      return SupportingUserRoutesConst.LOGIN;
    default:
      return undefined;
  }
}

/**
 * Redirects the user based on the HTTP error received from the API.
 * - Named errors (those with an 'errorType') are business errors to be handled
 * by the caller, except for the maintenance mode, which redirects to the maintenance page.
 * - Non-named errors 401, 403, 404 and 503 are redirected to the client login,
 * forbidden, not found and unexpected error pages, respectively.
 * - Any other non-named server error (5xx) is redirected to the unexpected error page.
 * - Client errors not listed above (e.g. 400 and 422) are left to the caller to be handled.
 * @param router application router.
 * @param error error to be inspected.
 */
async function redirectOnHttpError(
  router: Router,
  error: unknown,
): Promise<void> {
  if (!isAxiosError(error) || !error.response) {
    return;
  }
  const currentRoute = router.currentRoute.value;
  if (SHARED_ERROR_ROUTES.has(currentRoute.name)) {
    return;
  }
  const { status, data } = error.response;
  // Using replace to allow the user to go back to the previous page.
  switch (status) {
    case HttpStatusCode.Unauthorized: {
      // Likely an expired or invalid token, redirect to login.
      const loginRoute = getLoginRouteName();
      if (!loginRoute || currentRoute.name === loginRoute) {
        return;
      }
      // Ensures the expired token is not considered valid by the login route guards.
      AuthService.shared.keycloak?.clearToken();
      await router.replace({ name: loginRoute });
      return;
    }
    case HttpStatusCode.Forbidden:
      // User does not have permission to access the resource, redirect to forbidden page.
      await router.replace({ name: SharedRouteConst.FORBIDDEN_USER });
      return;
    case HttpStatusCode.NotFound:
      // Resource not found, redirect to not found page.
      await router.replace({
        name: SharedRouteConst.PAGE_NOT_FOUND,
        // Keeps the current URL while rendering the not found page.
        params: { pathMatch: currentRoute.path.substring(1).split("/") },
      });
      return;
    case HttpStatusCode.ServiceUnavailable:
      if (data.errorType === MAINTENANCE_MODE) {
        // Maintenance mode, redirect to maintenance page.
        await router.replace({ name: SharedRouteConst.MAINTENANCE_PAGE });
      } else {
        // Service unavailable, redirect to unexpected error page.
        await router.replace({ name: SharedRouteConst.UNEXPECTED_ERROR });
      }
      return;
    default:
      // Unexpected HTTP error, redirect to unexpected error page.
      await router.replace({ name: SharedRouteConst.UNEXPECTED_ERROR });
      return;
  }
}

/**
 * Registers the global HTTP error handling for all API calls. The error is always
 * propagated to the caller, which can still handle it (e.g. display a message).
 * @param router application router.
 */
export function registerHttpErrorInterceptor(router: Router): void {
  HttpClient.interceptors.response.use(undefined, async (error: unknown) => {
    await redirectOnHttpError(router, error);
    throw error;
  });
}
