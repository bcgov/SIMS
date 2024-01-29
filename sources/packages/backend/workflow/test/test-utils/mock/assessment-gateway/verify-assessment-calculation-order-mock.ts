import { WorkerMockedData } from "..";
import { WorkflowServiceTasks } from "../..";

/**
 * Creates the mock for 'Verify assessment calculation order' completed task.
 * @param options mock options.
 * - `isReadyForCalculation` calculation sequence order expected to be returned. By default
 * true will be returned to allow the workflow to proceed.
 * @returns mock for 'Verify assessment calculation order' completed task.
 */
export function createVerifyAssessmentCalculationOrderTaskMock(options?: {
  isReadyForCalculation?: boolean;
}): WorkerMockedData {
  const isReadyForCalculation = options?.isReadyForCalculation ?? true;
  return {
    serviceTaskId: WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
    options: {
      jobCompleteMock: { isReadyForCalculation },
    },
  };
}
