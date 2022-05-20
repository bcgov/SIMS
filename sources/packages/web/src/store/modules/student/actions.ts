import { ActionContext, ActionTree } from "vuex";
import { RootState } from "@/types";
import { StudentState } from "./student";
import { StudentService } from "@/services/StudentService";

export const actions: ActionTree<StudentState, RootState> = {
  async updateProfileData(
    context: ActionContext<StudentState, RootState>,
  ): Promise<void> {
    const response = await StudentService.shared.getStudentProfile();
    context.commit("updateProfileData", response);
  },

  setHasStudentAccount(
    context: ActionContext<StudentState, RootState>,
    hasStudentAccount: boolean,
  ) {
    context.commit("setHasStudentAccount", hasStudentAccount);
  },
};
