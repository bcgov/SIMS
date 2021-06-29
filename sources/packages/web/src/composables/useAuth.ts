import { AppConfigService } from "@/services/AppConfigService";
import { computed } from "vue";

export function useAuth() {
  const isAuthenticated = computed(
    () => AppConfigService.shared.authService?.authenticated === true,
  );

  return { isAuthenticated };
}
