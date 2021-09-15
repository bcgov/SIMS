import { AuthService } from "@/services/AuthService";
import { AppIDPType, ClientIdType } from "@/types";
import { computed } from "vue";

export function useAuth() {
  const isAuthenticated = computed(
    () => AuthService.shared.keycloak?.authenticated === true,
  );

  const parsedToken = computed(() => AuthService.shared.userToken);

  const executeLogin = async (idp: AppIDPType): Promise<void> => {
    return AuthService.shared.keycloak?.login({
      idpHint: idp.toLowerCase(),
    });
  };

  const executeLogout = async (clientType: ClientIdType): Promise<void> => {
    return AuthService.shared.logout(clientType);
  };

  return { isAuthenticated, parsedToken, executeLogin, executeLogout };
}
