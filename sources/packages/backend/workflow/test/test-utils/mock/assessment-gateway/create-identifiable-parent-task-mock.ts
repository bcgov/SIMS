import {
  PUBLISH_MESSAGE_TIME_TO_LEAVE_SECONDS,
  WorkflowServiceTasks,
} from "../..";
import { WorkerMockedData } from "..";

/**
 * Creates the mock for 'Create identifiable parent supporting user' completed task
 * and publish the necessary messages to unblock the workflow.
 * @param options.
 * - `supportingUserId` ID of the mocked supporting user that will also be created using mocks.
 * @returns mocked created supporting user ID and one mocked message to unblock the workflow.
 */
export function createIdentifiableParentTaskMock(options: {
  createdSupportingUserId: number;
  parent: 1 | 2;
}): WorkerMockedData {
  // Create messages to be published for the supporting user ID provided.
  const jobMessageMocks = {
    name: "supporting-user-info-received",
    correlationKey: options.createdSupportingUserId.toString(),
    variables: {},
    timeToLive: PUBLISH_MESSAGE_TIME_TO_LEAVE_SECONDS,
  };
  return {
    serviceTaskId: WorkflowServiceTasks.CreateIdentifiableParentTask,
    options: {
      jobCompleteMock: {
        createdSupportingUserId: options.createdSupportingUserId,
      },
      jobMessageMocks: [jobMessageMocks],
      multiInstanceLoopCounter: options.parent,
    },
  };
}
