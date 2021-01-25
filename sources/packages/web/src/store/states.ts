export interface RootState {
  version: string;
}

export class AuthState {
  isAuthenticated = false;
  token?: string;
  name?: string;
  age?: string;
  birthdate?: string;
  displayName?: string;
  email?: string;
  emailVerified?: string;
  familyName?: string;
  gender?: string;
  givenName?: string;
  identityAssuranceLevel?: string;
}
