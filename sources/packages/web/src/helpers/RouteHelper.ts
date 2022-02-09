import { AuthService } from "@/services/AuthService";
import { AppIDPType, AppRoutes, AuthStatus } from "../types";
import { ClientIdType } from "../types/contracts/ConfigContract";

export class RouteHelper {
  /**
   * Gets absolute root route for a client (e.g. http://domain.bc.gov.ca/student).
   * @param clientType client type to have the root route defined.
   * @returns absolute root route
   */
  static getAbsoluteRootRoute(clientType: ClientIdType): string {
    return `${window.location.protocol}//${
      window.location.host
    }${this.getRootRoute(clientType)}`;
  }

  /**
   * Gets the root route based on the client type.
   * @param clientType client type to be verified.
   * @returns root route for the client type.
   */
  private static getRootRoute(clientType: ClientIdType): AppRoutes {
    switch (clientType) {
      case ClientIdType.Student:
        return AppRoutes.StudentRoot;
      case ClientIdType.Institution:
        return AppRoutes.InstitutionRoot;
      case ClientIdType.AEST:
        return AppRoutes.AESTRoot;
      case ClientIdType.SupportingUsers:
        return AppRoutes.SupportingUsersRoot;
    }
  }

  /**
   * Determines whether the user is navigating to the root of some
   * application (e.g. /institution, /student, /aest).
   * @param path path to be verified.
   * @param clientType client type to be verified.
   * @returns true if root route
   */
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
      case ClientIdType.Student:
      case ClientIdType.SupportingUsers:
        allowedIDP = AppIDPType.BCSC;
        break;
      case ClientIdType.Institution:
        allowedIDP = AppIDPType.BCeID;
        break;
      case ClientIdType.AEST:
        allowedIDP = AppIDPType.IDIR;
        break;
    }
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
    if (clientType !== AuthService.shared.authClientType) {
      // If config service was not initialized with the same client type,
      // the user is not allowed to proceed.
      return AuthStatus.ForbiddenUser;
    }

    if (!AuthService.shared.keycloak?.authenticated) {
      if (toPath.includes(AppRoutes.Login)) {
        // If not authenticated but he is trying to access the login page to authenticate, allow it.
        return AuthStatus.Continue;
      }

      // The user is not authenticated and he is trying to access a page other than login.
      return AuthStatus.RequiredLogin;
    }

    if (
      !AuthService.shared.userToken ||
      !RouteHelper.isAllowedIDP(clientType, AuthService.shared.userToken.IDP)
    ) {
      // User is not authenticated to the correct Keycloak client/IDP.
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

  /**
   * Associates a plain html hyperlink, like the ones that can be declared in
   * form.io definitions, and allow the association with a method call, for
   * instance to redirect the user to a Vue route.
   * @param htmlElementId html hyperlink id.
   * @param click method to be invoked.
   */
  static AssociateHyperlinkClick(htmlElementId: string, click: () => void) {
    const htmlHyperlink = document.getElementById(htmlElementId);
    if (htmlHyperlink) {
      htmlHyperlink.onclick = (event: MouseEvent) => {
        event.preventDefault();
        click();
      };
    }
  }
}
