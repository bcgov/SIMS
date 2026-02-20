import {
  PUBLISH_MESSAGE_TIME_TO_LEAVE_SECONDS,
  WorkflowServiceTasks,
} from "../..";
import { WorkerMockedData } from "..";

/**
 * Creates the mock for 'Create identifiable partner supporting user' completed task
 * and publish the necessary messages to unblock the workflow.
 * @param options.
 * - `createdSupportingUserId` ID of the mocked supporting user that will also be created using mocks.
 * @returns mocked created supporting user ID and one mocked message to unblock the workflow.
 */
export function createIdentifiablePartnerTaskMock(options: {
  createdSupportingUserId: number;
}): WorkerMockedData {
  // Create messages to be published for the supporting user ID provided.
  const jobMessageMocks = {
    name: "supporting-user-info-received",
    correlationKey: options.createdSupportingUserId.toString(),
    variables: {},
    timeToLive: PUBLISH_MESSAGE_TIME_TO_LEAVE_SECONDS,
  };
  return {
    serviceTaskId: WorkflowServiceTasks.CreateIdentifiablePartnerTask,
    options: {
      jobCompleteMock: {
        createdSupportingUserId: options.createdSupportingUserId,
      },
      jobMessageMocks: [jobMessageMocks],
    },
  };
}
