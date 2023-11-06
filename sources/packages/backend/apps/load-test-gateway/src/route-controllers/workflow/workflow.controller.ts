import { Controller, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { WorkflowDataLoadService } from "../../services";
import { ZBClient } from "zeebe-node";
import { ZEEBE_PROCESS_INSTANCE_COMPLETE_TIMEOUT } from "../../utils/system-configurations-constants";

@Controller("workflow")
export class WorkflowController {
  constructor(
    private readonly workflowDataLoadService: WorkflowDataLoadService,
    private readonly zeebeClient: ZBClient,
  ) {}
  /**
   * Load the application and assessment data required for the load test.
   * @param dataIterations load test iterations.
   * @returns student assessments.
   */
  @Post("load-assessment-data/:iterations")
  async loadAssessmentData(
    @Param("iterations", ParseIntPipe) iterations: number,
  ): Promise<number[]> {
    const assessments =
      await this.workflowDataLoadService.loadApplicationAssessmentData(
        iterations,
      );
    return assessments.map((assessment) => assessment.id);
  }

  /**
   * Submit an assessment for workflow execution.
   * @param assessmentId assessment id.
   */
  @Patch("submit-assessment/:assessmentId")
  async submitAssessment(
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
  ): Promise<void> {
    await this.zeebeClient.createProcessInstanceWithResult({
      bpmnProcessId: "assessment-gateway",
      variables: {
        assessmentId: assessmentId,
      },
      requestTimeout: ZEEBE_PROCESS_INSTANCE_COMPLETE_TIMEOUT,
    });
  }
}
