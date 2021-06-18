import { Injectable } from "@nestjs/common";
import { WorkflowService } from "..";
import { WorkflowsNames } from "./constants";
import { WorkflowStartResult } from "./workflow.models";

@Injectable()
export class WorkflowActionsService {
  constructor(private readonly workflowService: WorkflowService) {}

  async startApplicationAssessment(
    applicationId: number,
  ): Promise<WorkflowStartResult> {
    return this.workflowService.start(WorkflowsNames.assessmentGateway, {
      variables: {
        applicationId: {
          value: applicationId,
          type: "integer",
        },
      },
    });
  }
}
