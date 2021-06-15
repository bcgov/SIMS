import { MutationTree } from "vuex";

import {
  InstitutionLocationState,
  AuthorizationsForStore,
  LocationStateForStore,
  UserStateForStore,
} from "@/types";

export const mutations: MutationTree<InstitutionLocationState> = {
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
