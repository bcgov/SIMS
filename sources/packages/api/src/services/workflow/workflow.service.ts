import { Injectable } from "@nestjs/common";
import { WorkflowConfig } from "../../types";
import { ConfigService } from "../config/config.service";
import axios from "axios";
import { WorkflowStartResult } from "./workflow.models";
import { TokensService } from "../auth/tokens.service";

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
}
