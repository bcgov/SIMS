import { ActionTree } from "vuex";
import { AuthState, RootState } from "../../states";

export const actions: ActionTree<AuthState, RootState> = {
    login(context, token: any): void {
        context.commit("setAuthenticated", token.tokenParsed);
    },
    logout(context): void {
        context.commit("setAuthenticated", false);
    },
}