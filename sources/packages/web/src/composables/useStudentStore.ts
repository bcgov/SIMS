import { computed } from "vue";
import { Store, useStore } from "vuex";
import {
  SINValidStatus,
  StudentRestriction,
  StudentState,
} from "@/store/modules/student/student";

export function useStudentStore(rootStore?: Store<any>) {
  const store = rootStore ?? useStore();
  const hasStudentAccount = computed<boolean>(
    () => store.state.student.hasStudentAccount,
  );

  const sinValidStatus = computed<SINValidStatus>(
    () => store.state.student.sinValidStatus,
  );

  const updateProfileData = async () => {
    await store.dispatch("student/updateProfileData");
  };

  const setHasStudentAccount = async (hasAccount: boolean) => {
    await store.dispatch("student/setHasStudentAccount", hasAccount);
  };

  const updateRestrictions = async () => {
    await store.dispatch("student/updateStudentRestrictions");
  };

  const hasRestrictionError = computed<boolean>(() => {
    return store.getters["student/hasRestrictionError"];
  });

  const hasRestrictionWarning = computed<boolean>(() => {
    return store.getters["student/hasRestrictionWarning"];
  });

  const activeRestrictions = computed<StudentRestriction[]>(() => {
    return store.getters["student/getRestrictions"];
  });

  const studentDetails = computed<StudentState>(() => {
    return store.getters["student/studentDetails"];
  });

  return {
    updateProfileData,
    sinValidStatus,
    setHasStudentAccount,
    hasStudentAccount,
    updateRestrictions,
    hasRestrictionError,
    hasRestrictionWarning,
    activeRestrictions,
    studentDetails,
  };
}
