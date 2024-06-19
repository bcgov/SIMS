import { WorkflowData } from "@sims/sims-db";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import { WorkflowWrapUpJobInDTO } from "../../assessment.dto";
import {
  ICustomHeaders,
  IOutputVariables,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";

/**
 * Creates a fake workflow wrap up payload.
 * @param assessmentId assessment id.
 * @param workflowData workflow data.
 * @returns fake workflow wrap up payload.
 */
export function createFakeWorkflowWrapUpPayload(
  assessmentId: number,
  workflowData: WorkflowData,
): Readonly<
  ZeebeJob<WorkflowWrapUpJobInDTO, ICustomHeaders, IOutputVariables>
> {
  return createFakeWorkerJob<
    WorkflowWrapUpJobInDTO,
    ICustomHeaders,
    IOutputVariables
  >({
    variables: { assessmentId, workflowData },
  });
}
