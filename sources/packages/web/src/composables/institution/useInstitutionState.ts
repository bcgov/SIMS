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

  /**
   * Get all store information needed for the institution store.
   */
  const initialize = async () => {
    await store.dispatch("institution/initialize");
  };

  /**
   * Get institution details needed for the institution store.
   */
  const getInstitutionDetails = async () => {
    await store.dispatch("institution/getInstitutionDetails");
  };

  /**
   * Set the institution setup user property to institution user state.
   */
  const setInstitutionSetupUser = async () => {
    await store.dispatch("institution/setInstitutionSetupUser");
  };

  return {
    institutionState,
    getLocationName,
    setInstitutionSetupUser,
    initialize,
    getInstitutionDetails,
  };
}
