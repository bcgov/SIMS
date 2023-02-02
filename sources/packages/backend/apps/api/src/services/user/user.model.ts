import { IdentityProviders } from "@sims/sims-db";

export interface UserLoginInfo {
  id: number;
  isActive: boolean;
  studentId?: number;
  identityProviderType?: IdentityProviders;
}
