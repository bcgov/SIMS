import { AppConfigService } from "@/services/AppConfigService";
import { computed } from "vue";
import { useStore } from "vuex";

export function useInstitutionAuth() {
  const store = useStore();
  const isAuthenticated = computed(
    () => AppConfigService.shared.authService?.authenticated === true,
  );
  const isAdmin = computed(() => store.state.institution.userState?.isAdmin);
  const userAuth = computed(
    () => store.state.institution.authorizationsState?.authorizations,
  );
  return { isAdmin, isAuthenticated, userAuth };
}
