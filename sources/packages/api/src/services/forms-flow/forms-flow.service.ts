import { Injectable } from "@nestjs/common";
import { CreateApplicationPayload } from "../../types";
import { ConfigService } from "..";
import axios from "axios";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import { TokensService } from "../auth/tokens.service";

/**
 * Service to handle interactions with FormsFlow.ai.
 */
@Injectable()
export class FormsFlowService {
  @InjectLogger()
  logger: LoggerService;

  private formFlowApiUrl: string;

  constructor(
    private readonly tokensService: TokensService,
    configService: ConfigService,
  ) {
    this.formFlowApiUrl = configService.getConfig().formFlowApiUrl;
  }

  public async createApplication(payload: CreateApplicationPayload) {
    try {
      const endpoint = `${this.formFlowApiUrl}/application/create`;
      const authHeader = await this.createAuthHeader();
      await axios.post(endpoint, payload, authHeader);
    } catch (error) {
      this.logger.error("Error while creating an application on FormsFlow.ai.");
      throw error;
    }
  }

  private async createAuthHeader(): Promise<any> {
    // TODO: Hold and reuse the ticket until it is valid.
    const accessToken = await this.tokensService.simsApiClient.getToken();
    return {
      headers: { Authorization: `Bearer ${accessToken}` },
    };
  }
}
