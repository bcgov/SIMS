import { Controller, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { WorkflowDataLoadService } from "../../services";
import { ZBClient } from "zeebe-node";

@Controller("workflow")
export class WorkflowController {
  constructor(
    private readonly workflowDataLoadService: WorkflowDataLoadService,
    private readonly zeebeClient: ZBClient,
  ) {}
  @Post("prepare-assessment-data/:iterations")
  async prepareAssessmentData(
    @Param("iterations", ParseIntPipe) iterations: number,
  ): Promise<number[]> {
    const assessments =
      await this.workflowDataLoadService.loadApplicationAssessmentData(
        iterations,
      );
    return assessments.map((assessment) => assessment.id);
  }

  @Patch("submit-assessment/:assessmentId")
  async submitAssessment(
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
  ): Promise<void> {
    await this.zeebeClient.createProcessInstanceWithResult({
      bpmnProcessId: "assessment-gateway",
      variables: {
        assessmentId: assessmentId,
      },
      requestTimeout: 90000,
    });
  }
}
