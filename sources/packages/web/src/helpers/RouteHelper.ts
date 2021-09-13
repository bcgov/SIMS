import { AppConfigService } from "@/services/AppConfigService";
import { AppIDPType, ApplicationToken, AppRoutes, AuthStatus } from "../types";
import { ClientIdType } from "../types/contracts/ConfigContract";

export class RouteHelper {
  private static getRootRoute(clientType: ClientIdType): AppRoutes {
    switch (clientType) {
      case ClientIdType.STUDENT:
        return AppRoutes.StudentRoot;
      case ClientIdType.INSTITUTION:
        return AppRoutes.InstitutionRoot;
      case ClientIdType.AEST:
        return AppRoutes.AESTRoot;
    }
  }

  private static isRootRoute(path: string, clientType: ClientIdType): boolean {
    const root = RouteHelper.getRootRoute(clientType);
    return path === root;
  }

  /**
   * Determines if the client was authorized through the expected IDP.
   * @param clientType client type to be checked.
   * @param idp identity provider used for authentication on Key Cloak.
   * @returns true if IDP is allowed, otherwise, false.
   */
  private static isAllowedIDP(
    clientType: ClientIdType,
    idp: AppIDPType,
  ): boolean {
    let allowedIDP = AppIDPType.UNKNOWN;
    switch (clientType) {
      case ClientIdType.STUDENT:
        allowedIDP = AppIDPType.BCSC;
        break;
      case ClientIdType.INSTITUTION:
        allowedIDP = AppIDPType.BCeID;
        break;
      case ClientIdType.AEST:
        allowedIDP = AppIDPType.IDIR;
        break;
    }

    console.log("allowedIDP:", allowedIDP);
    console.log("idp:", idp);

    return allowedIDP === idp;
  }

  /**
   * Evaluate the current authentication status and defines if the
   * navigation can continue or any special action is needed.
   * @param clientType authentication client type to be assessed.
   * @param toPath path where the user is being redirected.
   * @returns status of the navigation.
   */
  static getNavigationAuthStatus(
    clientType: ClientIdType,
    toPath: string,
  ): AuthStatus {
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
      console.dir(token);
      if (
        token.azp !== clientType ||
        !RouteHelper.isAllowedIDP(clientType, token.IDP)
      ) {
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
