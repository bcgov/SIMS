import { ApplicationExceptionStatus } from "@sims/sims-db";
import { createMockedWorkerResult, WorkflowServiceTasks } from "..";

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
