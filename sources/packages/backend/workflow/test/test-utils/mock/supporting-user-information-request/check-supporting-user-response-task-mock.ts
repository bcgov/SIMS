import { WorkflowSubprocesses, WorkflowServiceTasks } from "../..";
import { WorkerMockedData } from "../mock.utils";

/**
 * Creates the mock for 'Check Supporting User Response' completed task.
 * @param options mock options.
 * - `totalIncome` total income that must be present to allow the workflow
 * to advance.
 * - `subprocesses` subprocess reference when the workflow was invoked
 * using a call activity. It can be defines as one or multiple ones case
 * the workflow was invoked from subprocess inside another subprocess.
 * @returns mock for 'Check Supporting User Response' completed task.
 */
export function createCheckSupportingUserResponseTaskMock(options: {
  totalIncome: number;
  subprocesses?: WorkflowSubprocesses;
}): WorkerMockedData {
  return {
    serviceTaskId: WorkflowServiceTasks.CheckSupportingUserResponseTask,
    options: {
      jobCompleteMock: {
        totalIncome: options.totalIncome,
      },
      subprocesses: [options?.subprocesses],
    },
  };
}
