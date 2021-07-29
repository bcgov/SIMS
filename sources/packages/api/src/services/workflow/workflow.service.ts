import { Injectable } from "@nestjs/common";
import { WorkflowConfig } from "../../types";
import { ConfigService, TokensService } from "..";
import axios from "axios";
import { SendMessagePayload, WorkflowStartResult } from "./workflow.models";

@Injectable()
export class WorkflowService {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokensService: TokensService,
  ) {}

  get config(): WorkflowConfig {
    return this.configService.getConfig().workflow;
  }

  workflowUrl(flowName: string, operation: string) {
    return `${this.config.ruleEngineUrl}/process-definition/key/${flowName}/${operation}`;
  }

  async start(name: string, payload: any): Promise<WorkflowStartResult> {
    const startURL = this.workflowUrl(name, "start");
    const token = await this.tokensService.simsApiClient.getToken();
    const response = await axios.post(startURL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data as WorkflowStartResult;
  }

  /**
   * Correlates a message to the process engine to either trigger
   * a message start event or an intermediate message catching event.
   * @param payload message parameters.
   */
  async sendMessage(payload: SendMessagePayload): Promise<void> {
    const messageUrl = `${this.config.ruleEngineUrl}/message`;
    const token = await this.tokensService.simsApiClient.getToken();
    await axios.post(messageUrl, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
