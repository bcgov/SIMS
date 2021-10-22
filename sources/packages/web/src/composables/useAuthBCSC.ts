import { AuthService } from "@/services/AuthService";
import { BCSCParsedToken } from "@/types";

export function useAuthBCSC() {
  const bcscParsedToken = AuthService.shared.keycloak
    ?.tokenParsed as BCSCParsedToken;
  return { bcscParsedToken };
}
