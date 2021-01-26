import { MutationTree } from "vuex";
import { AuthState } from "../../states";

export const mutations: MutationTree<AuthState> = {
    setAuthenticated(state: AuthState, token: any){
        
        state.isAuthenticated = true;
      
        state.identityAssuranceLevel = token.identity_assurance_level;
    }
};
