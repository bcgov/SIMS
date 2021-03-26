import { Inject, Injectable } from "@nestjs/common";
import { UserPasswordCredential, ServiceAccountType } from "../../types";
import { KeycloakService } from "../auth/keycloak/keycloak.service";
import { TokenResponse } from "../auth/keycloak/token-response.model";
import { ConfigService } from "../config/config.service";

export class ServiceAccount implements ServiceAccountType {
  name?: string;
  credential: UserPasswordCredential;
  clientId: string;
  // TODO: Get token from any kind of storage service
  _tokenResp?: TokenResponse;

  async token(): Promise<string> {
    if (this._tokenResp) {
      return this._tokenResp.access_token;
    } else {
      // Get token from KC
      this._tokenResp = await KeycloakService.shared.getToken(
        this.credential.userName,
        this.credential.password,
        this.clientId,
      );
      return this._tokenResp.access_token;
    }
  }
}

@Injectable()
export class ServiceAccountService {
  workflowServiceAccount: ServiceAccount;
  constructor(private readonly config: ConfigService) {
    this.workflowServiceAccount = new ServiceAccount();
    this.workflowServiceAccount.credential = this.config.getConfig().workflow.serviceAccountCredential;
    // TODO: Create proper env variable
    this.workflowServiceAccount.clientId = "forms-flow-web";
  }
}
