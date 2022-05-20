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
};
