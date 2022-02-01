import { InstitutionStateForStore } from "@/types";
import { computed } from "vue";
import { useStore } from "vuex";

export function useInstitutionState() {
  const store = useStore();

  const institutionState = computed(
    () => store.state.institution.institutionState as InstitutionStateForStore,
  );

  return {
    institutionState,
  };
}
