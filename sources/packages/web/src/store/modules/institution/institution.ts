import { Module } from "vuex";

import {
  InstitutionLocationState,
  RootState,
  InstitutionUserAndAuthDetails,
  InstitutionLocationsDetails,
} from "@/types";

import { actions } from "./actions";
import { getters } from "./getters";
import { mutations } from "./mutations";

export const state: InstitutionLocationState = {
  myInstitutionAndUserDetailsState: {} as InstitutionUserAndAuthDetails,
  myInstitutionLocationsState: {} as InstitutionLocationsDetails,
};

const namespaced = true;

export const institution: Module<InstitutionLocationState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations,
};
