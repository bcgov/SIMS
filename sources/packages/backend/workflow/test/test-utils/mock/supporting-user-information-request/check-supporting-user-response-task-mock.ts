import { WorkflowSubprocesses, WorkflowServiceTasks } from "../..";
import { createMockedWorkerResult } from "../mock.utils";

/**
 * Create the mock for 'Check Supporting User Response' completed task.
 * @param options mock options.
 * - `supportingUserId` supporting user id to returned the successful check
 * where the totalIncome is used to unblock the workflow.
 * - `subprocesses` subprocess reference when the workflow was invoked
 * using a call activity. It can be define as one or multiple ones case
 * the workflow was invoked from subprocess inside another subprocess.
 * @returns mock for 'Check Supporting User Response' completed task.
 */
export function createCheckSupportingUserResponseTaskMock(options: {
  supportingUserId: number;
  totalIncome: number;
  subprocesses?: WorkflowSubprocesses;
}): Record<string, unknown> {
  return createMockedWorkerResult(
    WorkflowServiceTasks.CheckSupportingUserResponseTask,
    {
      jobCompleteMock: {
        totalIncome: options.totalIncome,
      },
      subprocesses: [options?.subprocesses],
    },
  );
}
