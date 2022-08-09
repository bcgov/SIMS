import { AuthService } from "@/services/AuthService";
import { BCeIDParsedToken } from "@/types";

export function useAuthBCeID() {
  const bceidParsedToken = AuthService.shared.keycloak
    ?.tokenParsed as BCeIDParsedToken;
  return { bceidParsedToken };
}
