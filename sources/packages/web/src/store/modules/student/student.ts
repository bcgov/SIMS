export class StudentProfile {
  name?: string;
  age?: string;
  birthdate?: string;
  givenNames?: string;
  lastName?: string;
  email?: string;
  emailVerified?: string;
  familyName?: string;
  gender?: string;
  givenName?: string;
  middleName?: string;
  validSIN: any;
}

export class StudentState {
  profile: StudentProfile = new StudentProfile();
  hasStudentAccount = false;
  validSIN = null;
}

const initialState: StudentState = {
  profile: new StudentProfile(),
  hasStudentAccount: false,
  validSIN: null,
};

export const student = {
  namespaced: true,
  state: initialState,

  mutations: {
    SET_STUDENT_PROFILE_DATA(state: StudentState, parsedToken: any) {
      state.profile.name = parsedToken.name;
      state.profile.age = parsedToken.age;
      state.profile.birthdate = parsedToken.birthdate;
      state.profile.givenNames = parsedToken.givenNames;
      state.profile.lastName = parsedToken.lastName;
      state.profile.email = parsedToken.email;
      state.profile.emailVerified = parsedToken.email_verified;
      state.profile.familyName = parsedToken.family_name;
      state.profile.gender = parsedToken.gender;
      state.profile.middleName = parsedToken.middle_name;
    },

    SET_HAS_STUDENT_ACCOUNT(state: StudentState, hasStudentAccount: boolean) {
      state.hasStudentAccount = hasStudentAccount;
    },

    SET_VALID_SIN(state: StudentState, validSIN: any) {
      state.validSIN = validSIN;
    },
  },

  actions: {
    setHasValidSIN({ commit }: { commit: Function }, validSIN: boolean | null) {
      commit("SET_VALID_SIN", validSIN);
    },

    setStudentProfileData({ commit }: { commit: Function }, token: any) {
      commit("SET_STUDENT_PROFILE_DATA", token.tokenParsed);
    },

    setHasStudentAccount(
      { commit }: { commit: Function },
      hasStudentAccount: boolean,
    ) {
      commit("SET_HAS_STUDENT_ACCOUNT", hasStudentAccount);
    },
  },
};
