import { Module } from "vuex";

import {
  InstitutionLocationState,
  RootState,
  UserStateForStore,
  LocationStateForStore,
  AuthorizationsForStore,
  InstitutionStateForStore,
} from "@/types";

import { actions } from "./actions";
import { getters } from "./getters";
import { mutations } from "./mutations";

export const state: InstitutionLocationState = {
  userState: {} as UserStateForStore,
  institutionState: {} as InstitutionStateForStore,
  locationState: [] as LocationStateForStore[],
  authorizationsState: {} as AuthorizationsForStore,
};

const namespaced = true;

export const institution: Module<InstitutionLocationState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations,
};
