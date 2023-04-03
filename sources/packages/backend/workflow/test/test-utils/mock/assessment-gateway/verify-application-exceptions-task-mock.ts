import { ApplicationExceptionStatus } from "@sims/sims-db";
import { WorkflowServiceTasks } from "../..";
import { createMockedWorkerResult } from "..";

/**
 * Creates the mock for 'Verify Application Exceptions' completed task.
 * @param options mock options.
 * - `status` application status expected to be returned. By default
 * 'Approved' will be returned to allow the workflow to proceed.
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
