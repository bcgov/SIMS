import { SINValidStatus } from "@/store/modules/student/student";
import { computed } from "vue";
import { Store, useStore } from "vuex";

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

  const setHasStudentAccount = async (hasStudentAccount: boolean) => {
    await store.dispatch("student/setHasStudentAccount", hasStudentAccount);
  };

  return {
    updateProfileData,
    sinValidStatus,
    setHasStudentAccount,
    hasStudentAccount,
  };
}
