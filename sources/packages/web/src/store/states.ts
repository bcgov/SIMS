export interface RootState {
  version: string;
}

export class AuthState {
    isAuthenticated?: boolean
    token?: string
    identityAssuranceLevel?: string   
}



