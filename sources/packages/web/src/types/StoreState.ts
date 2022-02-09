import {
  UserStateForStore,
  AuthorizationsForStore,
  LocationStateForStore,
  ClientIdType,
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

export interface LoggedInUserClientTypeState {
  clientType: ClientIdType;
}
