import { Duration } from "zeebe-node";
import {
  createMockedWorkerResult,
  WorkflowParentScopes,
  WorkflowServiceTasks,
} from "..";

export function createIncomeRequestTaskMock(options?: {
  incomeVerificationId: number;
  scope?: WorkflowParentScopes;
}): Record<string, unknown> {
  const incomeVerificationId = options?.incomeVerificationId ?? 1;
  return createMockedWorkerResult(WorkflowServiceTasks.CreateIncomeRequest, {
    jobCompleteMock: {
      incomeVerificationCompleted: true,
      incomeVerificationId,
    },
    jobMessageMocks: [
      {
        name: "income-verified",
        correlationKey: incomeVerificationId.toString(),
        variables: {},
        timeToLive: Duration.seconds.of(5),
      },
    ],
    scopes: [options?.scope],
  });
}
