import { MutationTree } from "vuex";

import {
  InstitutionLocationState,
  InstitutionUserAndAuthDetails,
  InstitutionLocationsDetails,
} from "@/types";

export const mutations: MutationTree<InstitutionLocationState> = {
  setmyInstitutionAndUserDetailsState(
    state: InstitutionLocationState,
    myInstitutionAndUserDetailsState: InstitutionUserAndAuthDetails,
  ) {
    state.myInstitutionAndUserDetailsState = myInstitutionAndUserDetailsState;
  },

  setmyInstitutionLocationsDetailsState(
    state: InstitutionLocationState,
    myInstitutionLocationsState: InstitutionLocationsDetails,
  ) {
    state.myInstitutionLocationsState = myInstitutionLocationsState;
  },
};
