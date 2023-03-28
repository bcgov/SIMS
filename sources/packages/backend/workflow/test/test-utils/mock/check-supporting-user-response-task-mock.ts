import { Duration } from "zeebe-node";
import {
  createMockedWorkerResult,
  WorkflowParentScopes,
  WorkflowServiceTasks,
} from "..";

export function createCheckSupportingUserResponseTaskMock(options: {
  supportingUserId: number;
  scope?: WorkflowParentScopes;
}): Record<string, unknown> {
  return createMockedWorkerResult(
    WorkflowServiceTasks.CheckSupportingUserResponseTask,
    {
      jobCompleteMock: {
        incomeVerificationCompleted: true,
        supportingUserId: options.supportingUserId,
      },
      jobMessageMocks: [
        {
          name: "supporting-user-info-received",
          correlationKey: options.supportingUserId.toString(),
          variables: {},
          timeToLive: Duration.seconds.of(5),
        },
      ],
      scopes: [options?.scope],
    },
  );
}
