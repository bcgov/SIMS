import { GetterTree } from "vuex";
import {
  RootState,
  RestrictionNotificationType,
  StudentRestriction,
} from "@/types";
import { StudentState } from "./student";

export const getters: GetterTree<StudentState, RootState> = {
  hasRestriction(state: StudentState): boolean {
    return state.restrictions?.some(
      (restriction) => restriction.type === RestrictionNotificationType.Error,
    );
  },
  hasWarning(state: StudentState): boolean {
    return state.restrictions?.some(
      (restriction) => restriction.type === RestrictionNotificationType.Warning,
    );
  },
  getRestrictions(state: StudentState): StudentRestriction[] {
    return state.restrictions?.filter(
      (restriction) =>
        restriction.type === RestrictionNotificationType.Warning ||
        restriction.type === RestrictionNotificationType.Error,
    );
  },
};
