import { Injectable } from "@nestjs/common";
import {
  CreateApplicationPayload,
  FormsFlowConfig,
  WorkflowConfig,
} from "../../types";
import { ConfigService } from "..";
import axios from "axios";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import { KeycloakService } from "../auth/keycloak/keycloak.service";

/**
 * Service to handle interactions with FormsFlow.ai.
 */
@Injectable()
export class FormsFlowService {
  @InjectLogger()
  logger: LoggerService;

  private config: FormsFlowConfig;

  constructor(
    private readonly keycloakService: KeycloakService,
    configService: ConfigService,
  ) {
    this.config = configService.getConfig().formsFlow;
  }

  public async createApplication(payload: CreateApplicationPayload) {
    try {
      const endpoint = `${this.config.formFlowApiUrl}/application/create`;
      const authHeader = await this.createAuthHeader();
      await axios.post(endpoint, payload, authHeader);
    } catch (error) {
      this.logger.error("Error while creating an application on FormsFlow.ai.");
      throw error;
    }
  }

  private async createAuthHeader(): Promise<any> {
    // TODO: Hold and reuse the ticket until it is valid.
    const tokenResponse = await this.keycloakService.getTokenFromClientSecret(
      this.config.credential.ClientId,
      this.config.credential.ClientSecret,
    );
    return {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    };
  }
}
