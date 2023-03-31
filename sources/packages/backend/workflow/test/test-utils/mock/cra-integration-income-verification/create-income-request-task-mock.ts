import { Duration } from "zeebe-node";
import { WorkflowServiceTasks, WorkflowSubprocesses } from "../..";
import { createMockedWorkerResult } from "../mock.utils";

/**
 * Create the mock for 'Create Income request' completed task
 * and also publish the message to unblock the workflow.
 * @param options mock options.
 * - `incomeVerificationId` income verification that will be waiting for
 * the message to be unblocked.
 * - `subprocesses` subprocess reference when the workflow was invoked
 * using a call activity. It can be define as one or multiple ones case
 * the workflow was invoked from subprocess inside another subprocess.
 * @returns mock for 'Create Income request' completed task and also publish
 * the message to unblock the workflow.
 */
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
