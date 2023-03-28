import { Duration } from "zeebe-node";
import {
  createMockedWorkerResult,
  WorkflowParentScopes,
  WorkflowServiceTasks,
} from "..";

export function createCreateSupportingUsersParentsTaskMock(options: {
  supportingUserIds: number[];
  scope?: WorkflowParentScopes;
}): Record<string, unknown> {
  // Create messages to be published for each supporting user id provided.
  // For instance, for parent 1 and parent 2 it will be needed one message
  // for each parent to unblock the workflow.
  const jobMessageMocks = options.supportingUserIds.map((supportingUserId) => ({
    name: "supporting-user-info-received",
    correlationKey: supportingUserId.toString(),
    variables: {},
    timeToLive: Duration.seconds.of(5),
  }));
  return createMockedWorkerResult(
    WorkflowServiceTasks.CreateSupportingUsersParentsTask,
    {
      jobCompleteMock: {
        createdSupportingUsersIds: options.supportingUserIds,
      },
      jobMessageMocks,
      scopes: [options?.scope],
    },
  );
}
