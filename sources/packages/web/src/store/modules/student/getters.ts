import { GetterTree } from "vuex";
import {
  RootState,
  RestrictionNotificationType,
  StudentRestriction,
} from "@/types";
import { StudentState } from "./student";

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
  getRestrictions(state: StudentState): StudentRestriction[] {
    return state.restrictions;
  },
};
