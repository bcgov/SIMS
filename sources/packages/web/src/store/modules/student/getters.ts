import { GetterTree } from "vuex";
import { RootState, RestrictionNotificationType, SINStatusEnum } from "@/types";
import { StudentState, StudentRestriction } from "./student";

export const getters: GetterTree<StudentState, RootState> = {
  hasRestrictionError(state: StudentState): boolean {
    return state.restrictions.some(
      (restriction) => restriction.type === RestrictionNotificationType.Error,
    );
  },
  hasRestrictionWarning(state: StudentState): boolean {
    return state.restrictions.some(
      (restriction) => restriction.type === RestrictionNotificationType.Warning,
    );
  },
  hasValidSIN(state: StudentState): boolean {
    return state.sinValidStatus.sinStatus === SINStatusEnum.VALID;
  },

  //We are considering the restrictions of notification type warning or error only.
  getRestrictions(state: StudentState): StudentRestriction[] {
    return state.restrictions.filter(
      (restriction) =>
        restriction.type === RestrictionNotificationType.Warning ||
        restriction.type === RestrictionNotificationType.Error,
    );
  },

  studentDetails(state: StudentState): StudentState {
    return state;
  },
};
