import { Module } from "vuex";

import {
  InstitutionLocationState,
  RootState,
  UserStateForStore,
  LocationStateForStore,
  AuthorizationsForStore,
} from "@/types";

import { actions } from "./actions";
import { getters } from "./getters";
import { mutations } from "./mutations";

export const state: InstitutionLocationState = {
  userState: {} as UserStateForStore,
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
