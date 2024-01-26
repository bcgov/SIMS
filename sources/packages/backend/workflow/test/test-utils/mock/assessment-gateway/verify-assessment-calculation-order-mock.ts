import { WorkerMockedData } from "..";
import { WorkflowServiceTasks } from "../..";

/**
 * Creates the mock for 'Verify assessment calculation order' completed task.
 * @param options mock options.
 * - `isFirstInCalculationSequence` calculation sequence order expected to be returned. By default
 * true will be returned to allow the workflow to proceed.
 * @returns mock for 'Verify assessment calculation order' completed task.
 */
export function createVerifyApplicationExceptionsTaskMock(options?: {
  isFirstInCalculationSequence?: boolean;
}): WorkerMockedData {
  const isFirstInCalculationSequence =
    options?.isFirstInCalculationSequence ?? true;
  return {
    serviceTaskId: WorkflowServiceTasks.VerifyApplicationExceptions,
    options: {
      jobCompleteMock: { isFirstInCalculationSequence },
    },
  };
}
