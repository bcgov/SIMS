import { GetterTree } from "vuex";

import {
  InstitutionLocationState,
  RootState,
  UserStateForStore,
  LocationStateForStore,
  AuthorizationsForStore,
} from "@/types";

export const getters: GetterTree<InstitutionLocationState, RootState> = {
  myDetails(state: InstitutionLocationState): UserStateForStore {
    const { userState } = state;
    return userState;
  },

  myAuthorizationDetails(
    state: InstitutionLocationState,
  ): AuthorizationsForStore {
    const { authorizationsState } = state;
    return authorizationsState;
  },

  myInstitutionLocations(
    state: InstitutionLocationState,
  ): LocationStateForStore[] {
    const { locationState } = state;
    return locationState;
  },
};
