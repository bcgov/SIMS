import { Duration } from "zeebe-node";
import {
  createMockedWorkerResult,
  WorkflowServiceTasks,
  WorkflowSubprocesses,
} from "..";

export function createIncomeRequestTaskMock(options?: {
  incomeVerificationId: number;
  subprocesses?: WorkflowSubprocesses;
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
    subprocesses: [options?.subprocesses],
  });
}
