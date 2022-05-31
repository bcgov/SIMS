import { Module } from "vuex";
import { RootState, RestrictionNotificationType } from "@/types";
import { actions } from "./actions";
import { getters } from "./getters";
import { mutations } from "./mutations";
import { SINStatusEnum } from "@/types/contracts/StudentContract";

export class SINValidStatus {
  sinStatus?: SINStatusEnum;
  severity?: string;
  message?: string;
}

export class StudentState {
  hasStudentAccount = false;
  sinValidStatus: SINValidStatus = new SINValidStatus();
  restrictions: StudentRestriction[] = [];
}

const state: StudentState = {
  hasStudentAccount: false,
  sinValidStatus: new SINValidStatus(),
  restrictions: [],
};

const namespaced = true;

export const student: Module<StudentState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations,
};

/**
 * Contract for student restriction.
 */
export interface StudentRestriction {
  /**
   * code is the restriction code.
   */
  code: string;
  /**
   * type is the notification type.
   */
  type: RestrictionNotificationType;
}
