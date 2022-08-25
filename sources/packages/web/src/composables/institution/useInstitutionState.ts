import { InstitutionStateForStore, LocationStateForStore } from "@/types";
import { computed } from "vue";
import { useStore } from "vuex";

export function useInstitutionState() {
  const store = useStore();
  const institutionState = computed(
    () => store.state.institution.institutionState as InstitutionStateForStore,
  );

  const getLocationName = (locationId: number) => {
    return store.getters["institution/myInstitutionLocations"].find(
      (location: LocationStateForStore) => location.id === locationId,
    ).name;
  };

  return {
    institutionState,
    getLocationName,
  };
}
