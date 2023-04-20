import { MutationTree } from "vuex";

import {
  InstitutionLocationState,
  AuthorizationsForStore,
  LocationStateForStore,
  UserStateForStore,
  InstitutionStateForStore,
} from "@/types";

export const mutations: MutationTree<InstitutionLocationState> = {
  setInstitutionDetails(
    state: InstitutionLocationState,
    institutionState: InstitutionStateForStore,
  ) {
    state.institutionState = institutionState;
  },

  setMyDetailsState(
    state: InstitutionLocationState,
    userState: UserStateForStore,
  ) {
    state.userState = userState;
  },

  setMyAuthorizationState(
    state: InstitutionLocationState,
    authorizationsState: AuthorizationsForStore,
  ) {
    state.authorizationsState = authorizationsState;
  },

  setMyInstitutionLocationsDetailsState(
    state: InstitutionLocationState,
    locationState: LocationStateForStore[],
  ) {
    state.locationState = locationState;
  },

  /**
   * Set the institution setup user property to institution user state.
   * @param state Institution state.
   * @param isInstitutionSetupUser value which specifies if the user is
   * institution setup user.
   */
  setInstitutionSetupUser(
    state: InstitutionLocationState,
    isInstitutionSetupUser: boolean,
  ) {
    state.userState.isInstitutionSetupUser = isInstitutionSetupUser;
  },
};
