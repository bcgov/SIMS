import { computed } from "vue";
import { Store, useStore } from "vuex";
import { SINValidStatus } from "@/store/modules/student/student";
import { StudentRestriction } from "@/types";

export function useStudentStore(rootStore?: Store<any>) {
  const store = rootStore ?? useStore();
  const hasStudentAccount = computed(
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

  const hasRestriction = computed<boolean>(() => {
    return store.getters["student/hasRestriction"];
  });

  const hasWarning = computed<boolean>(() => {
    return store.getters["student/hasWarning"];
  });

  const getRestrictions = (): StudentRestriction[] => {
    return store.getters["student/getRestrictions"];
  };

  const activeRestrictions = computed<StudentRestriction[]>(() => {
    return store.getters["student/getRestrictions"];
  });

  return {
    updateProfileData,
    sinValidStatus,
    setHasStudentAccount,
    hasStudentAccount,
    updateRestrictions,
    hasRestriction,
    hasWarning,
    getRestrictions,
    activeRestrictions,
  };
}
