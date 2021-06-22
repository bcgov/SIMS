import { Injectable } from "@nestjs/common";
import { WorkflowService } from "..";
import { WorkflowStartResult } from "./workflow.models";

@Injectable()
export class WorkflowActionsService {
  constructor(private readonly workflowService: WorkflowService) {}

  async startApplicationAssessment(
    workflowName: string,
    applicationId: number,
  ): Promise<WorkflowStartResult> {
    try {
      return await this.workflowService.start(workflowName, {
        variables: {
          applicationId: {
            value: applicationId,
            type: "integer",
          },
        },
      });
    } catch (error) {
      throw new Error(
        `Error while starting application assessment workflow: ${workflowName}`,
      );
    }
  }
}
