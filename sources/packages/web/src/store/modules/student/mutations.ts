import { MutationTree } from "vuex";
import { StudentFormInfo } from "@/types";
import { StudentState, StudentRestriction } from "./student";
import { useFormatters } from "@/composables";

export const mutations: MutationTree<StudentState> = {
  updateProfileData(state: StudentState, student: StudentFormInfo) {
    const formatters = useFormatters();
    state.sinValidStatus = formatters.parseSINValidStatus(student.validSin);
  },

  setHasStudentAccount(state: StudentState, hasStudentAccount: boolean) {
    state.hasStudentAccount = hasStudentAccount;
  },

  updateStudentRestrictions(
    state: StudentState,
    restrictions: StudentRestriction[],
  ) {
    state.restrictions = restrictions;
  },
};
