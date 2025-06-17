import { MutationTree } from "vuex";
import { StudentProfile } from "@/types";
import { StudentState, StudentRestriction } from "./student";
import { useFormatters } from "@/composables";

export const mutations: MutationTree<StudentState> = {
  updateProfileData(state: StudentState, student: StudentProfile) {
    const formatters = useFormatters();
    state.sinValidStatus = formatters.parseSINValidStatus(student.validSin);
    state.firstName = student.firstName;
    state.fullName = student.fullName;
    state.isBetaUser = student.isBetaUser ?? false;
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
