import {
  UserStateForStore,
  AuthorizationsForStore,
  LocationStateForStore,
  InstitutionStateForStore,
} from "@/types";

export interface RootState {
  version: string;
}

export interface InstitutionLocationState {
  locationState: LocationStateForStore[];
  institutionState: InstitutionStateForStore;
  userState: UserStateForStore;
  authorizationsState: AuthorizationsForStore;
}
