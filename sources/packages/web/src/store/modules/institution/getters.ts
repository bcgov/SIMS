import { GetterTree } from "vuex";

import {
  InstitutionLocationState,
  RootState,
  InstitutionUserAndAuthDetailsForStore,
  InstitutionLocationsDetailsForStore,
} from "@/types";

export const getters: GetterTree<InstitutionLocationState, RootState> = {
  myInstitutionDetails(
    state: InstitutionLocationState,
  ): InstitutionUserAndAuthDetailsForStore {
    const { myInstitutionAndUserDetailsState } = state;
    return myInstitutionAndUserDetailsState;
  },
  myInstitutionLocations(
    state: InstitutionLocationState,
  ): InstitutionLocationsDetailsForStore {
    const { myInstitutionLocationsState } = state;
    return myInstitutionLocationsState;
  },
};
