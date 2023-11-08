/**
 * Methods like setup and default are part of the K6 life cycle.
 * @see https://k6.io/docs/using-k6/test-lifecycle
 * The exported options are part of the K6 configuration.
 * @see https://k6.io/docs/using-k6/k6-options
 */
import { check, sleep } from "k6";
import { loadTestPostCall } from "../../utils/load-test-api/load-test-api";
import { Options } from "k6/options";
import execution from "k6/execution";
import { getLoadTestGatewayCredentials } from "../../utils/load-test-api/load-test-api-creds";
import { ClientSecretCredential } from "../../utils/auth";

/**
 * Load test number of iterations to run.
 */
const ITERATIONS = 15;
/**
 * Virtual users to run load test.
 * Please ensure that the number of virtual users
 * must always be less than the iterations.
 */
const VIRTUAL_USERS = 15;

interface SetupData {
  assessmentIds: number[];
  credentials: ClientSecretCredential;
}

/**
 * Load all the required data as per the required iterations
 * to execute assessment workflow.
 * @returns setup data.
 */
export function setup(): SetupData {
  const setupEndpoint = `workflow-assessment-submission/setup/${ITERATIONS}`;
  const credentials = getLoadTestGatewayCredentials();
  const response = loadTestPostCall(setupEndpoint, credentials);
  const assessmentIds = response.json() as number[];
  return { assessmentIds, credentials };
}

export const options: Options = {
  scenarios: {
    submitAssessment: {
      executor: "shared-iterations",
      vus: VIRTUAL_USERS,
      iterations: ITERATIONS,
      maxDuration: "1h",
    },
  },
};

/**
 * Test scenario to be executed as many times as defined by the test options.
 * Part of the K6 life cycle.
 * @param setupData setup data returned by setup method.
 */
export default function (setupData: SetupData) {
  const assessmentId =
    setupData.assessmentIds[execution.scenario.iterationInTest];
  const executeEndpoint = `workflow-assessment-submission/execute/${assessmentId}`;
  const submitResponse = loadTestPostCall(
    executeEndpoint,
    setupData.credentials
  );
  check(submitResponse, {
    "Executed with success": (r) => r.status === 201,
  });
  sleep(1);
}
