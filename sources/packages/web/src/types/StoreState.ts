import {
  UserStateForStore,
  AuthorizationsForStore,
  LocationStateForStore,
  ClientIdType,
} from "@/types";

export interface RootState {
  version: string;
}

export interface InstitutionLocationState {
  locationState: LocationStateForStore[];
  userState: UserStateForStore;
  authorizationsState: AuthorizationsForStore;
}

export interface LoggedInUserClientTypeState {
  clientType: ClientIdType;
}
