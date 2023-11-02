import { Controller, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { WorkflowDataPreparationService } from "../../services";
import { ZBClient } from "zeebe-node";
import { Application } from "@sims/sims-db";

@Controller("workflow")
export class WorkflowController {
  constructor(
    private readonly workflowDataPreparationService: WorkflowDataPreparationService,
    private readonly zeebeClient: ZBClient,
  ) {}
  @Post("prepare-assessment-data/:iterations")
  async prepareAssessmentData(
    @Param("iterations", ParseIntPipe) iterations: number,
  ): Promise<number[]> {
    const submittedApplicationPromise: Promise<Application>[] = [];
    for (let i = 1; i <= iterations; i++) {
      submittedApplicationPromise.push(
        this.workflowDataPreparationService.createApplicationAndAssessment(),
      );
    }
    const applications = await Promise.all(submittedApplicationPromise);
    return applications.map((app) => app.id);
  }

  @Patch("submit-assessment/:assessmentId")
  async submitAssessment(
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
  ): Promise<void> {
    console.log("Assessment started for: ", assessmentId);
    await this.zeebeClient.createProcessInstanceWithResult({
      bpmnProcessId: "assessment-gateway",
      variables: {
        assessmentId: assessmentId,
      },
      requestTimeout: 9000,
    });
  }
}
