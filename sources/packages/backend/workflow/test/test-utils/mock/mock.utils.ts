import { PublishMessageRequest } from "zeebe-node";
import {
  JOB_COMPLETED_RESULT_SUFFIX,
  JOB_MESSAGE_RESULT_SUFFIX,
} from "../constants/mock-constants";
import {
  WorkflowServiceTasks,
  WorkflowSubprocesses,
} from "../constants/workflow-variables-constants";

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
   "create-income-request-task": {
    "studentIncomeVerificationSubprocess": {
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
    "parent1IncomeVerificationSubprocess": {
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
    if (!rootMockedData[mockedWorker.serviceTaskId]) {
      rootMockedData[mockedWorker.serviceTaskId] = {};
    }
    // Creates a subprocess hierarchy to store the worker mock assuming
    // that the hierarchy could be partially created already due to another
    // subprocess for the same service task id.
    let mockedData = rootMockedData[mockedWorker.serviceTaskId];
    mockedWorker.options.subprocesses?.forEach((subprocess) => {
      if (!mockedData[subprocess]) {
        mockedData[subprocess] = {};
      }
      mockedData = mockedData[subprocess];
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
