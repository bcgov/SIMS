import { ApplicationEditStatus, ApplicationStatus } from "@sims/sims-db";
import { WorkflowServiceTasks } from "../..";
import { WorkerMockedData } from "..";

/**
 * Creates the mock for 'Application change request approval' task.
 * @param options mock options.
 * - `applicationStatus` application status expected to be returned.
 * - `applicationEditStatus` application edit status expected to be returned.
 * @returns mock for 'Application change request approval' task.
 */
export function createApplicationChangeRequestApprovalTaskMock(options?: {
  applicationStatus?: ApplicationStatus;
  applicationEditStatus: ApplicationEditStatus;
}): WorkerMockedData {
  return {
    serviceTaskId: WorkflowServiceTasks.ApplicationChangeRequestApproval,
    options: {
      jobCompleteMock: {
        applicationStatus: options?.applicationStatus,
        applicationEditStatus: options.applicationEditStatus,
      },
    },
  };
}
