import { computed } from "vue";
import { useStore } from "vuex";
import { useAuth } from "..";

export function useInstitutionAuth() {
  const store = useStore();
  const { isAuthenticated } = useAuth();
  const isAdmin = computed(() => store.state.institution.userState?.isAdmin);
  const userAuth = computed(
    () => store.state.institution.authorizationsState?.authorizations,
  );
  return { isAdmin, isAuthenticated, userAuth };
}
