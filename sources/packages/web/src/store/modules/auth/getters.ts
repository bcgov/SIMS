import { GetterTree } from "vuex";
import { AuthState, RootState } from "../../states";

export const getters: GetterTree<AuthState, RootState> = {
    isAuthenticated(state: AuthState): boolean {
        return state.isAuthenticated;
    },
};
