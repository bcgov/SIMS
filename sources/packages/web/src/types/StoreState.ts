import {
  InstitutionUserAndAuthDetailsForStore,
  InstitutionLocationsDetailsForStore,
} from "@/types";

export interface RootState {
  version: string;
}

export interface InstitutionLocationState {
  myInstitutionAndUserDetailsState: InstitutionUserAndAuthDetailsForStore;
  myInstitutionLocationsState: InstitutionLocationsDetailsForStore;
}
