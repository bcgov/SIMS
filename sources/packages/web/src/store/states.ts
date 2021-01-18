export interface RootState { }

export class AuthState {
    isAuthenticated: boolean,
    token?: string,
    name?: string,
    age?: string,
    birthdate?: string,
    displayName?: string,
    email?: string,
    emailVerified?: string,
    familyName?: string,
    gender?: string,
    givenName?: string,
    identityAssuranceLevel?: string,   
}