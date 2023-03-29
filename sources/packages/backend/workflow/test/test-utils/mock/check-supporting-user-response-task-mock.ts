import { Duration } from "zeebe-node";
import {
  createMockedWorkerResult,
  WorkflowParentScopes,
  WorkflowServiceTasks,
} from "..";

export function createCheckSupportingUserResponseTaskMock(options: {
  supportingUserId: number;
  totalIncome: number;
  scope?: WorkflowParentScopes;
}): Record<string, unknown> {
  return createMockedWorkerResult(
    WorkflowServiceTasks.CheckSupportingUserResponseTask,
    {
      jobCompleteMock: {
        totalIncome: options.totalIncome,
      },
      scopes: [options?.scope],
    },
  );
}
