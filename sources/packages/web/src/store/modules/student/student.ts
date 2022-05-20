import { Module } from "vuex";
import { RootState } from "@/types";
import { actions } from "./actions";
import { getters } from "./getters";
import { mutations } from "./mutations";

import { SINStatusEnum } from "@/types/contracts/StudentContract";

type storeCommit = (name: string, data: any) => void;
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
  sinStatus?: SINStatusEnum;
  severity?: string;
  message?: string;
}

export class StudentState {
  profile: StudentProfile = new StudentProfile();
  hasStudentAccount = false;
  sinValidStatus: SINValidStatus = new SINValidStatus();
}

const state: StudentState = {
  profile: new StudentProfile(),
  hasStudentAccount: false,
  sinValidStatus: new SINValidStatus(),
};

const namespaced = true;

export const institution: Module<StudentState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations,
};
