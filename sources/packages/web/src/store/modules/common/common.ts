import { Module } from "vuex";

import { RootState, ClientIdType, LoggedInUserClientTypeState } from "@/types";
import { actions } from "./actions";
import { getters } from "./getters";
import { mutations } from "./mutations";

export const state: LoggedInUserClientTypeState = {
  clientType: "" as ClientIdType,
};

const namespaced = true;

export const common: Module<LoggedInUserClientTypeState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations,
};
