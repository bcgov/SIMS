import { PublishMessageRequest, ZeebeJob } from "zeebe-node";
import {
  JOB_COMPLETED_RESULT_SUFFIX,
  JOB_MESSAGE_RESULT_SUFFIX,
  MOCKS_SEPARATOR,
  PARENT_SUBPROCESSES_VARIABLE,
  SERVICE_TASK_ID_SEPARATOR,
} from "../constants/mock-constants";
import {
  WorkflowServiceTasks,
  WorkflowSubprocesses,
} from "../constants/workflow-variables-constants";

/**
 * Regex for replace all.
 */
const SERVICE_TASK_ID_SEPARATOR_REGEX = new RegExp(
  SERVICE_TASK_ID_SEPARATOR,
  "g",
);

/**
 * Get the mock identifier for a completed job to be sent to the workflow,
 * for instance, create_supporting_users_for_parents_task_result, where:
 * - `create_supporting_users_for_parents_task`: service task id;
 * - `result`: suffix that identifies the job completed object.
 * @param serviceTaskId service task id that will have the job completed returned.
 * @returns mock identifier for a completed job to be sent to the workflow.
 */
export function getServiceTaskResultMockId(serviceTaskId: string) {
  return `${getNormalizedServiceTaskId(
    serviceTaskId,
  )}${MOCKS_SEPARATOR}${JOB_COMPLETED_RESULT_SUFFIX}`;
}

/**
 * Get the mock identifier for a message to be sent to the workflow,
 * for instance, create_supporting_users_for_parents_task_messageResult, where:
 * - `create_supporting_users_for_parents_task`: service task id;
 * - `messageResult`: suffix that identifies a message payload to be sent to the
 * workflow.
 * @param serviceTaskId service task id that will need to publish the message.
 * @returns mock identifier for a message to be sent to the workflow.
 */
export function getPublishMessageResultMockId(serviceTaskId: string) {
  return `${getNormalizedServiceTaskId(
    serviceTaskId,
  )}${MOCKS_SEPARATOR}${JOB_MESSAGE_RESULT_SUFFIX}`;
}

/**
 * Convert the service task id, usually declared as 'service-task-id' to the expected
 * Camunda variable name like service_task_id.
 * The usual variables along the workflow are following the camelCase pattern but service
 * task ids are actually following the kebab-case pattern, which is not a problem in general.
 * Based on it, while trying to use the service task ids as variables names we can
 * respect the Camunda recommendations (link below) and just convert the kebab-case to
 * snake_case pattern.
 * @see https://docs.camunda.io/docs/components/concepts/variables/#variable-names
 * @param serviceTaskId workflow service task id.
 * @returns service task id, usually declared as 'service-task-id' to the expected
 * Camunda variable name like service_task_id.
 */
function getNormalizedServiceTaskId(serviceTaskId: string) {
  return serviceTaskId.replace(
    SERVICE_TASK_ID_SEPARATOR_REGEX,
    MOCKS_SEPARATOR,
  );
}

/**
 * The service task id (a.k.a. elementId) is unique in the workflow where it is present but
 * can exist in multiple sub-processes (e.g. 'create-income-request'). In this case a special
 * variable, named as 'parentSubprocesses', is used to create a unique service task id.
 * The 'parentSubprocesses' variable is a list that can be appended with multiple scopes allowing
 * uniquely identifying the service ids at any level, for instance, a sub-process calling
 * a sub-process.
 * @param job worker job.
 * @returns unique service task id.
 */
export function getScopedServiceTaskId(job: ZeebeJob<unknown>): string {
  // Check if the service task id is in a sub-process.
  const parentSubprocesses: string[] | undefined =
    job.variables[PARENT_SUBPROCESSES_VARIABLE];
  if (parentSubprocesses?.length) {
    const scopedElementId = [...parentSubprocesses, job.elementId];
    return scopedElementId.join(MOCKS_SEPARATOR);
  }
  // If the element is not in a sub-process just return the element id.
  return job.elementId;
}

/**
 * Create the mocked objects to be used as the job completed object and/or to publish
 * messages to unblock the workflow.
 * @param serviceTaskId workflow service task id.
 * @param options mock creation options.
 * - `jobCompleteMock` the object to be returned when the job is completed.
 * If not provided a job complete message will be returned either way.
 * - `jobMessageMocks` optional messages to be sent to the workflow 'message intermediate catch event'.
 * For instance, when the assessment-gateway detects that the partner information is required and it
 * needs to be informed when the partner provided the information.
 * - `subprocesses` one or more workflow subprocess that contains the service
 * task id being mocked. For instance, the 'create-income-request-task' can be execute
 * multiple times (student, partner, parents) but it will happen under different
 * subprocesses.
 * Multiple parameters here would indicate the hierarchy of the subprocesses
 * till the service task id is found (e.g. 'create-income-request-task'). For instance,
 * if the service task id is a child of the SubprocessB and SubprocessB is a child of
 * SubprocessA, this array needs to be populated as [SubprocessA, SubprocessB], which will
 * create the service task unique identifier as SubprocessA_SubprocessB_create_income_request_task.
 * The most common scenario will be one subprocess, for instance, for 'create-income-request-task' under
 * the assessment-gateway workflow:
 * - for student income verification it would be studentIncomeVerificationSubprocess_create_income_request_task
 * - for partner income verification it would be partnerIncomeVerificationSubprocess_create_income_request_task
 * @returns mocked objects to be used by the worker.
 * @example
 * "create_supporting_users_for_parents_task_result": {
            "createdSupportingUsersIds": [
                2000,
                2001
            ]
        },
    "create_supporting_users_for_parents_task_messageResult": [
        {
            "name": "supporting-user-info-received",
            "correlationKey": "2000",
            "variables": {},
            "timeToLive": {
                "type": "SECONDS",
                "value": 5,
                "valueType": "TYPED_DURATION",
                "unit": "s"
            }
        },
        {
            "name": "supporting-user-info-received",
            "correlationKey": "2001",
            "variables": {},
            "timeToLive": {
                "type": "SECONDS",
                "value": 5,
                "valueType": "TYPED_DURATION",
                "unit": "s"
            }
        }
    ],
 */
export function createMockedWorkerResult(
  serviceTaskId: WorkflowServiceTasks,
  options: {
    jobCompleteMock?: unknown;
    jobMessageMocks?: PublishMessageRequest<unknown>[];
    subprocesses?: WorkflowSubprocesses[];
  },
): Record<string, unknown> {
  let fullServiceTaskId = serviceTaskId.toString();
  if (options?.subprocesses?.length) {
    fullServiceTaskId = [...options.subprocesses, fullServiceTaskId].join(
      MOCKS_SEPARATOR,
    );
  }
  const mockedWorkerResult: Record<string, unknown> = {};
  if (options.jobCompleteMock) {
    mockedWorkerResult[getServiceTaskResultMockId(fullServiceTaskId)] =
      options.jobCompleteMock;
  }
  if (options.jobMessageMocks?.length) {
    mockedWorkerResult[getPublishMessageResultMockId(fullServiceTaskId)] =
      options.jobMessageMocks;
  }
  return mockedWorkerResult;
}
