import {
  UserStateForStore,
  AuthorizationsForStore,
  LocationStateForStore,
} from "@/types";

export interface RootState {
  version: string;
}

export interface InstitutionLocationState {
  locationState: LocationStateForStore[];
  userState: UserStateForStore;
  authorizationsState: AuthorizationsForStore;
}
