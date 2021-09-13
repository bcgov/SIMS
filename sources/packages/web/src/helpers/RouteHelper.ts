import { AppConfigService } from "@/services/AppConfigService";
import { ApplicationToken, AppRoutes, AuthStatus } from "../types";
import { ClientIdType } from "../types/contracts/ConfigContract";

export class RouteHelper {
  static getRootRoute(clientType: ClientIdType): AppRoutes {
    switch (clientType) {
      case ClientIdType.STUDENT:
        return AppRoutes.StudentRoot;
      case ClientIdType.INSTITUTION:
        return AppRoutes.InstitutionRoot;
      case ClientIdType.AEST:
        return AppRoutes.AESTRoot;
    }
  }

  static isRootRoute(path: string, clientType: ClientIdType) {
    const root = RouteHelper.getRootRoute(clientType);
    return path === root;
  }

  static authStatus(clientType: ClientIdType, toPath: string): AuthStatus {
    if (clientType !== AppConfigService.shared.authClientType) {
      // If config service was not initialized with the same client type,
      // the user is not allowed to proceed.
      return AuthStatus.ForbiddenUser;
    }

    if (!AppConfigService.shared.authService?.authenticated) {
      if (toPath.includes(AppRoutes.Login)) {
        // If not authenticated but he is trying to access the login page to authenticate, so allow it.
        return AuthStatus.Continue;
      }

      // The user is not authenticated and he is trying to access a page other than login.
      return AuthStatus.RequiredLogin;
    }

    if (AppConfigService.shared.authService?.tokenParsed) {
      const token = AppConfigService.shared.authService
        ?.tokenParsed as ApplicationToken;

      if (token.azp !== clientType) {
        // User is not authenticated to the correct Keycloak client.
        return AuthStatus.ForbiddenUser;
      }
    } else {
      // Not able to parse Keycloak token.
      return AuthStatus.ForbiddenUser;
    }

    if (RouteHelper.isRootRoute(toPath, clientType)) {
      // User is trying to access the application root.
      // Redirect to the default page.
      return AuthStatus.RedirectHome;
    }

    if (toPath.includes(AppRoutes.Login)) {
      // User is trying to access the application login while he
      // is already authenticated. Redirect to the default page.
      return AuthStatus.RedirectHome;
    }

    // User is authenticated properly, allow the user to continue.
    return AuthStatus.Continue;
  }
}
