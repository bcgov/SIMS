import { WorkflowServiceTasks, WorkflowSubprocesses } from "../..";
import { WorkerMockedData } from "../mock.utils";

/**
 * Creates the mock for 'Check income request' task.
 * @param options mock options.
 * - `subprocesses` subprocess reference when the workflow was invoked
 * using a call activity. It can be defines as one or multiple ones case
 * the workflow was invoked from subprocess inside another subprocess.
 * @returns mock for 'Check income request' completed task.
 */
export function createCheckIncomeRequestTaskMock(options?: {
  subprocesses?: WorkflowSubprocesses;
}): WorkerMockedData {
  return {
    serviceTaskId: WorkflowServiceTasks.CheckIncomeRequest,
    options: {
      jobCompleteMock: {
        incomeVerificationCompleted: true,
      },
      subprocesses: [options?.subprocesses],
    },
  };
}
