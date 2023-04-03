import {
  PUBLISH_MESSAGE_TIME_TO_LEAVE_SECONDS,
  WorkflowServiceTasks,
} from "../..";
import { createMockedWorkerResult } from "..";

/**
 * Creates the mock for 'Create supporting users for parent/parents' completed task
 * and publish the necessary messages to unblock the workflow.
 * @param supportingUserIds ids (1 or 2) of the mocked support users that will
 * also be created using mocks.
 * @returns mocked ids and one mocked message for each provided id to unblock
 * the workflow.
 */
export function createCreateSupportingUsersParentsTaskMock(options: {
  supportingUserIds: number[];
}): Record<string, unknown> {
  // Create messages to be published for each supporting user id provided.
  // For instance, for parent 1 and parent 2 it will be needed one message
  // for each parent to unblock the workflow.
  const jobMessageMocks = options.supportingUserIds.map((supportingUserId) => ({
    name: "supporting-user-info-received",
    correlationKey: supportingUserId.toString(),
    variables: {},
    timeToLive: PUBLISH_MESSAGE_TIME_TO_LEAVE_SECONDS,
  }));
  return createMockedWorkerResult(
    WorkflowServiceTasks.CreateSupportingUsersParentsTask,
    {
      jobCompleteMock: {
        createdSupportingUsersIds: options.supportingUserIds,
      },
      jobMessageMocks,
    },
  );
}
