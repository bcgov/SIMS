import { SinStatusEnum } from "@/types/contracts/StudentContract";

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
  validSIN?: boolean;
}

export class SINValidStatus {
  sinStatus?: SinStatusEnum;
  severity?: string;
  message?: string;
}

export class StudentState {
  profile: StudentProfile = new StudentProfile();
  hasStudentAccount = false;
  sinValidStatus: SINValidStatus = new SINValidStatus();
}

const initialState: StudentState = {
  profile: new StudentProfile(),
  hasStudentAccount: false,
  sinValidStatus: new SINValidStatus(),
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

    SET_VALID_SIN(state: StudentState, sinValidStatus: SINValidStatus) {
      state.sinValidStatus = sinValidStatus;
    },
  },

  actions: {
    setHasValidSIN(
      { commit }: { commit: Function },
      sinValidStatus: SINValidStatus,
    ) {
      commit("SET_VALID_SIN", sinValidStatus);
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
