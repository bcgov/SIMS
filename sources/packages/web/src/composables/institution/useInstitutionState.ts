import { InstitutionStateForStore, LocationStateForStore } from "@/types";
import { computed } from "vue";
import { Store, useStore } from "vuex";

export function useInstitutionState(rootStore?: Store<any>) {
  const store = rootStore ?? useStore();
  const institutionState = computed(
    () => store.state.institution.institutionState as InstitutionStateForStore,
  );

  const getLocationName = (locationId: number) => {
    return store.getters["institution/myInstitutionLocations"].find(
      (location: LocationStateForStore) => location.id === locationId,
    ).name;
  };

  const initialize = async () => {
    await store.dispatch("institution/initialize");
  };

  const setInstitutionSetupUser = async () => {
    await store.dispatch("institution/setInstitutionSetupUser");
  };

  return {
    institutionState,
    getLocationName,
    setInstitutionSetupUser,
    initialize,
  };
}
