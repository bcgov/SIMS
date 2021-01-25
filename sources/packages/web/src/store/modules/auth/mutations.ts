import { MutationTree } from "vuex";
import { AuthState } from "../../states";

export const mutations: MutationTree<AuthState> = {
  setAuthenticated(state: AuthState, token: any) {
    state.isAuthenticated = true;
    state.name = token.name;
    state.age = token.age;
    state.birthdate = token.birthdate;
    state.displayName = token.displayName;
    state.email = token.email;
    state.emailVerified = token.email_verified;
    state.familyName = token.family_name;
    state.gender = token.gender;
    state.givenName = token.given_name;
    state.identityAssuranceLevel = token.identity_assurance_level;
  }
};
