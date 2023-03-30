import {
  createMockedWorkerResult,
  WorkflowServiceTasks,
  WorkflowSubprocesses,
} from "..";

export function createCheckIncomeRequestTaskMock(options?: {
  subprocesses?: WorkflowSubprocesses;
}): Record<string, unknown> {
  return createMockedWorkerResult(WorkflowServiceTasks.CheckIncomeRequest, {
    jobCompleteMock: {
      incomeVerificationCompleted: true,
    },
    subprocesses: [options?.subprocesses],
  });
}
