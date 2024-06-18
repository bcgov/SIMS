import { PublishMessageRequest } from "@camunda8/sdk/dist/zeebe/types";
import {
  JOB_COMPLETED_RESULT_SUFFIX,
  JOB_MESSAGE_RESULT_SUFFIX,
  JOB_PASSTHROUGH_SUFFIX,
  MOCKS_SEPARATOR,
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
 * Get the passthrough mock identifier for a completed job,
 * for instance, create_supporting_users_for_parents_task_passthrough, where:
 * - `create_supporting_users_for_parents_task`: service task id;
 * - `passthrough`: suffix that identifies the job passthrough identifier.
 * @param serviceTaskId service task id that will have the job passthrough defined.
 * @returns passthrough mock identifier for a completed job.
 */
export function getPassthroughTaskId(serviceTaskId: string) {
  return `${getNormalizedServiceTaskId(
    serviceTaskId,
  )}${MOCKS_SEPARATOR}${JOB_PASSTHROUGH_SUFFIX}`;
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
export function getNormalizedServiceTaskId(serviceTaskId: string) {
  return serviceTaskId.replace(
    SERVICE_TASK_ID_SEPARATOR_REGEX,
    MOCKS_SEPARATOR,
  );
}

/**
 * Information to create a mocked worker including the job completed object and/or the
 * messages to be published to unblock the workflow.
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
 * @returns mocked object to be used by a worker.
 */
export interface WorkerMockedData {
  serviceTaskId: WorkflowServiceTasks;
  options: {
    jobCompleteMock?: unknown;
    jobMessageMocks?: PublishMessageRequest<unknown>[];
    subprocesses?: WorkflowSubprocesses[];
  };
}

/**
 * Create the mocked objects to be used as the job completed object and/or to publish
 * messages to unblock the workflow.
 * @param mockedWorkers all mocked data expected to test the workflow scenario.
 * @returns mocked objects, see example below for one single mocked worker for 2
 * subprocesses that also need to have messages published.
 * @example
   "create_income_request_task": {
    "student_income_verification_subprocess": {
      "result": {
        "incomeVerificationCompleted": true,
        "incomeVerificationId": 1000
      },
      "messageResult": [
        {
          "name": "income-verified",
          "correlationKey": "1000",
          "variables": {},
          "timeToLive": {
            "type": "SECONDS",
            "value": 10,
            "valueType": "TYPED_DURATION",
            "unit": "s"
          }
        }
      ]
    },
    "parent1_income_verification_subprocess": {
      "result": {
        "incomeVerificationCompleted": true,
        "incomeVerificationId": 1001
      },
      "messageResult": [
        {
          "name": "income-verified",
          "correlationKey": "1001",
          "variables": {},
          "timeToLive": {
            "type": "SECONDS",
            "value": 10,
            "valueType": "TYPED_DURATION",
            "unit": "s"
          }
        }
      ]
    },
  },
 */
export function createWorkersMockedData(
  mockedWorkers: WorkerMockedData[],
): Record<string, unknown> {
  // Keep the consolidation of all mocked workers.
  const rootMockedData: Record<string, unknown> = {};
  for (const mockedWorker of mockedWorkers) {
    const serviceTaskId = getNormalizedServiceTaskId(
      mockedWorker.serviceTaskId,
    );
    if (!rootMockedData[serviceTaskId]) {
      rootMockedData[serviceTaskId] = {};
    }
    // Creates a subprocess hierarchy to store the worker mock assuming
    // that the hierarchy could be partially created already due to another
    // subprocess for the same service task id.
    let mockedData = rootMockedData[serviceTaskId];
    mockedWorker.options.subprocesses?.forEach((subprocess) => {
      const subprocessId = getNormalizedServiceTaskId(subprocess);
      if (!mockedData[subprocessId]) {
        mockedData[subprocessId] = {};
      }
      mockedData = mockedData[subprocessId];
    });
    // Create result mocked object.
    if (mockedWorker.options.jobCompleteMock) {
      mockedData[JOB_COMPLETED_RESULT_SUFFIX] =
        mockedWorker.options.jobCompleteMock;
    }
    // Create message result mocked object.
    if (mockedWorker.options.jobMessageMocks?.length) {
      mockedData[JOB_MESSAGE_RESULT_SUFFIX] =
        mockedWorker.options.jobMessageMocks;
    }
  }
  return rootMockedData;
}
