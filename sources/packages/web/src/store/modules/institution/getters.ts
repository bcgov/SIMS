import { GetterTree } from "vuex";

import {
  InstitutionLocationState,
  RootState,
  InstitutionUserAndAuthDetails,
  InstitutionLocationsDetails,
} from "@/types";

export const getters: GetterTree<InstitutionLocationState, RootState> = {
  myInstitutionDetails(
    state: InstitutionLocationState,
  ): InstitutionUserAndAuthDetails {
    const { myInstitutionAndUserDetailsState } = state;
    return myInstitutionAndUserDetailsState;
  },
  myInstitutionLocations(
    state: InstitutionLocationState,
  ): InstitutionLocationsDetails {
    const { myInstitutionLocationsState } = state;
    return myInstitutionLocationsState;
  },
};
