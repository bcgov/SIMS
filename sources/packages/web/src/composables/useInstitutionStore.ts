import { Store, useStore } from "vuex";

export function useInstitutionStore(rootStore?: Store<any>) {
  const store = rootStore ?? useStore();
  const locationName = (locationId: number) => {
    return store.getters["institution/myInstitutionLocations"].find(
      (d) => d.id === locationId,
    ).name;
  };
  return {
    locationName,
  };
}
