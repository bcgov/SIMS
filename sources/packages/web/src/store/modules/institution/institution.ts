export class InstitutionState {
  showHome!: boolean;
  showManageInstitution!: boolean;
}

const initialState: InstitutionState = {
  showHome: true,
  showManageInstitution: false,
};

export const institution = {
  namespaced: true,
  state: initialState,

  mutations: {
    SET_SHOW_HOME(state: InstitutionState, payload: boolean) {
      state.showHome = payload;
    },
    SET_SHOW_MANAGE_INSTITUTION(state: InstitutionState, payload: boolean) {
      state.showManageInstitution = payload;
    },
  },
  actions: {
    setShowHome({ commit }: { commit: Function }, payload: boolean) {
      commit("SET_SHOW_HOME", payload);
    },
    setShowManageInstitution({ commit }: { commit: Function }, payload: boolean) {
      commit("SET_SHOW_MANAGE_INSTITUTION", payload);
    },
  },
};
