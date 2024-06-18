import { Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { WorkflowDataLoadService } from "../../services";
import { ZEEBE_PROCESS_INSTANCE_COMPLETE_TIMEOUT } from "../../constants/system-configurations-constants";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";

@Controller("workflow-assessment-submission")
export class WorkflowAssessmentSubmissionController {
  constructor(
    private readonly workflowDataLoadService: WorkflowDataLoadService,
    private readonly zeebeClient: ZeebeGrpcClient,
  ) {}

  /**
   * Create application and assessment data required for the load test.
   * @param iterations load test iterations.
   * @returns student assessments.
   */
  @Post("setup/:iterations")
  async setup(
    @Param("iterations", ParseIntPipe) iterations: number,
  ): Promise<number[]> {
    const assessments =
      await this.workflowDataLoadService.createApplicationAssessmentData(
        iterations,
      );
    return assessments.map((assessment) => assessment.id);
  }

  /**
   * Submit an assessment for workflow execution.
   * @param assessmentId assessment id.
   */
  @Post("execute/:assessmentId")
  async execute(
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
