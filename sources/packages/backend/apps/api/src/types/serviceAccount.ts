import { UserPasswordCredential } from "./config";

export interface ServiceAccountType {
  name?: string;
  credential: UserPasswordCredential;
  clientId: string;
  token(): Promise<string>;
}
