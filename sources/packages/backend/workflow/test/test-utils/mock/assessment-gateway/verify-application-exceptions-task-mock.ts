import { ApplicationExceptionStatus } from "@sims/sims-db";
import { WorkflowServiceTasks } from "../..";
import { createMockedWorkerResult } from "..";

/**
 * Creates the mock for 'Verify Application Exceptions' completed task.
 * @param options mock options.
 * - `subprocesses` subprocess reference when the workflow was invoked
 * using a call activity. It can be defined as one or multiple ones case
 * the workflow was invoked from subprocess inside another subprocess.
 * @returns mock for 'Verify Application Exceptions' completed task.
 */
export function createVerifyApplicationExceptionsTaskMock(options?: {
  status: ApplicationExceptionStatus;
}) {
  const applicationExceptionStatus =
    options?.status ?? ApplicationExceptionStatus.Approved;
  return createMockedWorkerResult(
    WorkflowServiceTasks.VerifyApplicationExceptions,
    {
      jobCompleteMock: { applicationExceptionStatus },
    },
  );
}
