import {
  createMockedWorkerResult,
  WorkflowSubprocesses,
  WorkflowServiceTasks,
} from "..";

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
