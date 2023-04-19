import {
  InstitutionUserAuthRolesAndLocation,
  InstitutionUserRoles,
  UserStateForStore,
} from "@/types";
import { computed } from "vue";
import { Store, useStore } from "vuex";
import { useAuth } from "..";

export function useInstitutionAuth(rootStore?: Store<any>) {
  const store = rootStore ?? useStore();

  // From store get user details and authorizations.
  const institutionUserDetails = store.state.institution
    .userState as UserStateForStore;
  const authorizations =
    (store.state.institution.authorizationsState
      .authorizations as InstitutionUserAuthRolesAndLocation[]) ?? [];

  const { isAuthenticated } = useAuth();
  const isAuthenticatedInstitutionUser = computed(
    () => isAuthenticated.value && institutionUserDetails.isActive,
  );
  const isAdmin = computed(() => institutionUserDetails.isAdmin);
  const userFullName = computed(() => institutionUserDetails.userFullName);
  const userEmail = computed(() => institutionUserDetails.email);
  const userAuth = computed(() => authorizations);
  const isLegalSigningAuthority = computed(() =>
    authorizations.some(
      (auth) => auth.userRole === InstitutionUserRoles.legalSigningAuthority,
    ),
  );
  // If the bceid authenticated user is not an existing sims user
  // then it is assumed that the user has logged in to setup institution
  // and they are identified as institution set up user in route context.
  const isInstitutionSetupUser = computed(
    () => institutionUserDetails.isInstitutionSetupUser,
  );
  const hasLocationAccess = (locationId: number) =>
    authorizations.some(
      (authorization) => authorization.locationId === locationId,
    );
  const [userAuthorization] = authorizations;
  // User type Admin | User.
  const userType = computed(() => userAuthorization?.userType);

  return {
    isAdmin,
    isAuthenticated,
    isAuthenticatedInstitutionUser,
    userAuth,
    isLegalSigningAuthority,
    userFullName,
    userEmail,
    isInstitutionSetupUser,
    hasLocationAccess,
    userType,
  };
}
