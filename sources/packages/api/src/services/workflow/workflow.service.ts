import { Inject, Injectable } from "@nestjs/common";
import { WorkflowConfig } from "../../types";
import { ConfigService } from "../config/config.service";
import axios from "axios";
import { ServiceAccountService } from "../service-account/service-account.service";
import { WorkflowStartResult } from "./workflow.models";

@Injectable()
export class WorkflowService {
  constructor(
    private readonly configService: ConfigService,
    private readonly accountService: ServiceAccountService,
  ) {}

  get config(): WorkflowConfig {
    return this.configService.getConfig().workflow;
  }

  workflowUrl(flowName: string, operation: string) {
    return `${this.config.ruleEngineUrl}/process-definition/key/${flowName}/${operation}`;
  }

  async start(name: string, payload: any): Promise<WorkflowStartResult> {
    const startURL = this.workflowUrl(name, "start");
    const token = await this.accountService.workflowServiceAccount.token();
    const response = await axios.post(startURL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data as WorkflowStartResult;
  }
}
