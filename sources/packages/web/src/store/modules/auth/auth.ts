import { Module } from "vuex";
import { getters } from "./getters";
import { actions } from "./actions";
import { mutations } from "./mutations";
import { AuthState, RootState } from "../../states";


export const state: AuthState = {
    isAuthenticated: false,
};

const namespaced = true;

export const auth: Module<AuthState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations,
};
