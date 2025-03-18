import { WorkflowData } from "@sims/sims-db";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import {
  WorkflowWrapUpJobHeaderDTO,
  WorkflowWrapUpJobInDTO,
  WorkflowWrapUpType,
} from "../../assessment.dto";
import { IOutputVariables, ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";

/**
 * Creates a fake workflow wrap up payload.
 * @param assessmentId assessment id.
 * @param options options to customize the payload.
 * - `workflowData` workflow data.
 * - `wrapUpType` wrap up type, default {@link WorkflowWrapUpType.CompleteWrapUp} if not provided.
 * @returns fake workflow wrap up payload.
 */
export function createFakeWorkflowWrapUpPayload(
  assessmentId: number,
  options: {
    workflowData?: WorkflowData;
    wrapUpType?: WorkflowWrapUpType;
  } = {},
): Readonly<
  ZeebeJob<WorkflowWrapUpJobInDTO, WorkflowWrapUpJobHeaderDTO, IOutputVariables>
> {
  return createFakeWorkerJob<
    WorkflowWrapUpJobInDTO,
    WorkflowWrapUpJobHeaderDTO,
    IOutputVariables
  >({
    variables: { assessmentId, workflowData: options.workflowData },
    customHeaders: {
      wrapUpType: options.wrapUpType ?? WorkflowWrapUpType.CompleteWrapUp,
    },
  });
}
