export interface RootState { }

export interface AuthState {
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

export interface Notification {
    id: number,
    title: string,
    description: string
};

export interface NotificationState{
    notifications: Notification[];
}