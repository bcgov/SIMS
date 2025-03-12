import { ApplicationEditStatus } from "@sims/sims-db";
import {
  PUBLISH_MESSAGE_TIME_TO_LEAVE_SECONDS,
  WorkflowServiceTasks,
} from "../..";
import { WorkerMockedData } from "..";

/**
 * Creates the mock for 'Application change request approval' task.
 * @param options mock options.
 * - `taskCompleteApplicationEditStatus` application edit status to be returned by the approval task.
 * - `messageApplicationEditStatus` application edit status to be returned by the "approval provided message".
 * @param applicationId application ID to be used as correlation key for the "approval provided message".
 * @returns mock for 'Application change request approval' task.
 */
export function createApplicationChangeRequestApprovalTaskMock(options: {
  taskCompleteApplicationEditStatus?: ApplicationEditStatus;
  messageApplicationEditStatus?: ApplicationEditStatus;
  applicationId: number;
}): WorkerMockedData {
  // If not provided, set the default statuses to be returned as if it was waiting for approval.
  const taskCompleteApplicationEditStatus =
    options?.taskCompleteApplicationEditStatus ??
    ApplicationEditStatus.ChangePendingApproval;
  // If not provided, send the message as if it was approved.
  const messageApplicationEditStatus =
    options?.messageApplicationEditStatus ??
    ApplicationEditStatus.ChangedWithApproval;
  return {
    serviceTaskId: WorkflowServiceTasks.ApplicationChangeRequestApproval,
    options: {
      jobCompleteMock: {
        applicationEditStatus: taskCompleteApplicationEditStatus,
      },
      jobMessageMocks: [
        {
          name: "application-change-request-approval-provided",
          correlationKey: options.applicationId.toString(),
          variables: {
            applicationEditStatus: messageApplicationEditStatus,
          },
          timeToLive: PUBLISH_MESSAGE_TIME_TO_LEAVE_SECONDS,
        },
      ],
    },
  };
}
