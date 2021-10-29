import { RouteHelper } from "@/helpers";
import { AuthService } from "@/services/AuthService";
import { AppIDPType, ClientIdType } from "@/types";
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

  const executeRenewTokenIfExpired = () => {
    AuthService.shared.renewTokenIfExpired();
  };

  return {
    isAuthenticated,
    parsedToken,
    executeLogin,
    executeLogout,
    executeRenewTokenIfExpired,
  };
}
