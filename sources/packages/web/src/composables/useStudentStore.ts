import { computed } from "vue";
import { useStore } from "vuex";

export function useStudentStore() {
  const store = useStore();
  const hasStudentAccount = computed(
    () => store.state.student.hasStudentAccount,
  );
  return { hasStudentAccount };
}
