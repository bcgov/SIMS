import { Inject, Injectable } from "@nestjs/common";
import { WorkflowConfig } from "../../types";
import { ConfigService } from "../config/config.service";
import axios from "axios";
import { ServiceAccountService } from "../service-account/service-account.service";

@Injectable()
export class RuleEngineService {
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

  async start(name: string, payload: any) {
    const startURL = this.workflowUrl(name, "start");
    const token = await this.accountService.workflowServiceAccount.token();
    return axios.post(startURL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
