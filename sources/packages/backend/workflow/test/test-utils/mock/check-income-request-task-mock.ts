import {
  createMockedWorkerResult,
  WorkflowParentScopes,
  WorkflowServiceTasks,
} from "..";

export function createCheckIncomeRequestTaskMock(options?: {
  scope?: WorkflowParentScopes;
}): Record<string, unknown> {
  return createMockedWorkerResult(WorkflowServiceTasks.CheckIncomeRequest, {
    jobCompleteMock: {
      incomeVerificationCompleted: true,
    },
    scopes: [options?.scope],
  });
}
