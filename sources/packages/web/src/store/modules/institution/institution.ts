import { Module } from "vuex";

import {
  InstitutionLocationState,
  RootState,
  InstitutionUserAndAuthDetailsForStore,
  InstitutionLocationsDetailsForStore,
} from "@/types";

import { actions } from "./actions";
import { getters } from "./getters";
import { mutations } from "./mutations";

export const state: InstitutionLocationState = {
  myInstitutionAndUserDetailsState: {} as InstitutionUserAndAuthDetailsForStore,
  myInstitutionLocationsState: {} as InstitutionLocationsDetailsForStore,
};

const namespaced = true;

export const institution: Module<InstitutionLocationState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations,
};
