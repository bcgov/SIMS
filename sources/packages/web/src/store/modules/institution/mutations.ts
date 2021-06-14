import { MutationTree } from "vuex";

import {
  InstitutionLocationState,
  InstitutionUserAndAuthDetailsForStore,
  InstitutionLocationsDetailsForStore,
} from "@/types";

export const mutations: MutationTree<InstitutionLocationState> = {
  setMyInstitutionAndUserDetailsState(
    state: InstitutionLocationState,
    myInstitutionAndUserDetailsState: InstitutionUserAndAuthDetailsForStore,
  ) {
    state.myInstitutionAndUserDetailsState = myInstitutionAndUserDetailsState;
  },

  setMyInstitutionLocationsDetailsState(
    state: InstitutionLocationState,
    myInstitutionLocationsState: InstitutionLocationsDetailsForStore,
  ) {
    state.myInstitutionLocationsState = myInstitutionLocationsState;
  },
};
