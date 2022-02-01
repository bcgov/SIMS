import {
  InstitutionUserAuthRolesAndLocation,
  InstitutionUserRoles,
} from "@/types";
import { computed } from "vue";
import { useStore } from "vuex";
import { useAuth } from "..";

export function useInstitutionAuth() {
  const store = useStore();
  const { isAuthenticated } = useAuth();

  const isAdmin = computed(() => store.state.institution.userState?.isAdmin);
  const userFullName = computed(
    () => store.state.institution.userState?.userFullName,
  );
  const userEmail = computed(() => store.state.institution.userState?.email);

  const authorizations = store.state.institution.authorizationsState
    .authorizations as InstitutionUserAuthRolesAndLocation[];

  const userAuth = computed(() => authorizations);

  const isLegalSigningAuthority = computed(() =>
    authorizations.some(
      auth => auth.userRole === InstitutionUserRoles.legalSigningAuthority,
    ),
  );

  return {
    isAdmin,
    isAuthenticated,
    userAuth,
    isLegalSigningAuthority,
    userFullName,
    userEmail,
  };
}
