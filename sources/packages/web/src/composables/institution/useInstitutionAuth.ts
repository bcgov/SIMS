import {
  InstitutionUserAuthRolesAndLocation,
  InstitutionUserRoles,
  InstitutionUserTypes,
} from "@/types";
import { computed } from "vue";
import { Store, useStore } from "vuex";
import { useAuth } from "..";

export function useInstitutionAuth(rootStore?: Store<any>) {
  const store = rootStore ?? useStore();

  const { isAuthenticated } = useAuth();
  const isAuthenticatedInstitutionUser = computed(() => {
    return isAuthenticated.value && store.state.institution.userState.isActive;
  });
  const isAdmin = computed(() => store.state.institution.userState.isAdmin);
  const userFullName = computed(
    () => store.state.institution.userState.userFullName,
  );
  const userEmail = computed(() => store.state.institution.userState.email);
  const userAuth = computed(
    () => store.state.institution.authorizationsState?.authorizations ?? [],
  );
  const isLegalSigningAuthority = computed(() =>
    store.state.institution.authorizationsState?.authorizations.some(
      (auth: InstitutionUserAuthRolesAndLocation) =>
        auth.userRole === InstitutionUserRoles.legalSigningAuthority,
    ),
  );
  // If the bceid authenticated user is not an existing sims user
  // then it is assumed that the user has logged in to setup institution
  // and they are identified as institution set up user in route context.
  const isInstitutionSetupUser = computed(
    () => store.state.institution.userState.isInstitutionSetupUser,
  );
  const hasLocationAccess = (locationId: number) =>
    store.state.institution.authorizationsState?.authorizations.some(
      (auth: InstitutionUserAuthRolesAndLocation) =>
        auth.locationId === locationId,
    );

  // Get user type User | Read-only-user.
  const userType = (locationId: number) => {
    if (!store.state.institution.authorizationsState?.authorizations) {
      return undefined;
    }
    const userAuthorization =
      store.state.institution.authorizationsState.authorizations.find(
        (auth: InstitutionUserAuthRolesAndLocation) =>
          auth.locationId === locationId,
      );
    return userAuthorization?.userType;
  };

  const isBCPublic = computed(
    () => store.state.institution.institutionState?.isBCPublic,
  );

  const isReadOnlyUser = (locationId?: number) => {
    if (!locationId) return true;
    return store.state.institution.authorizationsState?.authorizations.some(
      (auth: InstitutionUserAuthRolesAndLocation) =>
        auth.locationId?.toString() === locationId.toString() &&
        auth.userType === InstitutionUserTypes.readOnlyUser,
    );
  };

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
    isBCPublic,
    isReadOnlyUser,
  };
}
