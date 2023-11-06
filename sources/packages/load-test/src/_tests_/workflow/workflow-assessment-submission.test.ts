/**
 * Methods like setup and default are part of the K6 life cycle.
 * @see https://k6.io/docs/using-k6/test-lifecycle
 * The exported options are part of the K6 configuration.
 * @see https://k6.io/docs/using-k6/k6-options
 */
import { check, sleep } from "k6";
import {
  workflowAssessmentSubmission,
  workflowLoadAssessmentData,
} from "../../utils/load-test-api/load-test-api";
import { Options } from "k6/options";
import execution from "k6/execution";
import { getLoadTestGatewayCredentials } from "../../utils/load-test-api/load-test-api-creds";

/**
 * Load test number of iterations to run.
 */
const ITERATIONS = 100;
/**
 * Virtual users to run load test.
 * Please ensure that the number of virtual users
 * must always be less than the iterations.
 */
const VIRTUAL_USERS = 10;

interface SetupData {
  assessmentIds: number[];
}

/**
 * Load all the required data as per the required iterations
 * to execute assessment workflow.
 * @returns setup data.
 */
export function setup(): SetupData {
  const credentials = getLoadTestGatewayCredentials();
  const assessmentIds = workflowLoadAssessmentData(ITERATIONS, credentials);
  return { assessmentIds };
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
 * Test scenario to executed as many times as defined by the test options.
 * Part of the K6 life cycle.
 * @param setupData setup data returned by setup method.
 */
export default function (setupData: SetupData) {
  const credentials = getLoadTestGatewayCredentials();
  const assessmentId =
    setupData.assessmentIds[execution.scenario.iterationInTest];
  const submitResponse = workflowAssessmentSubmission(
    assessmentId,
    credentials
  );
  check(submitResponse, {
    "Created with success": (r) => r.status === 201,
  });
  sleep(1);
}
