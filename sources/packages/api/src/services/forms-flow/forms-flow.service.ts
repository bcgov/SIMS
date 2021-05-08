import { Injectable } from "@nestjs/common";
import { CreateApplicationPayload, WorkflowConfig } from "../../types";
import { ConfigService, ServiceAccountService } from "..";
import axios from "axios";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";

@Injectable()
export class FormsFlowService {
  @InjectLogger()
  logger: LoggerService;

  private workflowConfig: WorkflowConfig;

  constructor(
    private readonly accountService: ServiceAccountService,
    configService: ConfigService,
  ) {
    this.workflowConfig = configService.getConfig().workflow;
  }

  public async createApplication(payload: CreateApplicationPayload) {
    try {
      const endpoint = `${this.workflowConfig.formFlowUrl}/application/create`;
      const authHeader = await this.createAuthHeader();
      await axios.post(endpoint, payload, authHeader);
    } catch (error) {
      this.logger.error("Error while creating an application on Forms Flow.");
      throw error;
    }
  }

  private async createAuthHeader(): Promise<any> {
    const token = await this.accountService.workflowServiceAccount.token();
    return { headers: { Authorization: `Bearer ${token}` } };
  }
}
