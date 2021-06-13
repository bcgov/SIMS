import {
  InstitutionUserAndAuthDetails,
  InstitutionLocationsDetails,
} from "@/types";

export interface RootState {
  version: string;
}

export interface InstitutionLocationState {
  myInstitutionAndUserDetailsState: InstitutionUserAndAuthDetails;
  myInstitutionLocationsState: InstitutionLocationsDetails;
}
