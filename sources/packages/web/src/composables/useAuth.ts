import { RouteHelper } from "@/helpers";
import { AuthService } from "@/services/AuthService";
import { AppIDPType, ClientIdType, Role } from "@/types";
import { computed } from "vue";

export function useAuth() {
  const isAuthenticated = computed(
    () => AuthService.shared.keycloak?.authenticated === true,
  );

  const parsedToken = computed(() => AuthService.shared.userToken);

  const executeLogin = async (
    clientType: ClientIdType,
    idp: AppIDPType,
  ): Promise<void> => {
    await AuthService.shared.keycloak?.login({
      idpHint: idp.toLowerCase(),
      redirectUri: RouteHelper.getAbsoluteRootRoute(clientType),
    });
  };

  const executeLogout = async (clientType: ClientIdType): Promise<void> => {
    await AuthService.shared.logout(clientType);
  };

  const hasRole = (role: Role): boolean => {
    const userToken = AuthService.shared.userToken;
    if (userToken?.resource_access && userToken?.azp) {
      const userRoles = userToken.resource_access[userToken.azp].roles;
      return userRoles?.includes(role);
    }
    return false;
  };

  return {
    isAuthenticated,
    parsedToken,
    executeLogin,
    executeLogout,
    hasRole,
  };
}
