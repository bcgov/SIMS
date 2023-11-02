/**
 * Methods like setup and default are part of the K6 life cycle.
 * @see https://k6.io/docs/using-k6/test-lifecycle
 * The exported options are part of the K6 configuration.
 * @see https://k6.io/docs/using-k6/k6-options
 */
import { check, sleep } from "k6";
import {
  workflowAssessmentSubmission,
  workflowPrepareAssessmentData,
} from "../../utils/load-test-api/load-test-api";
import { Options } from "k6/options";
import execution from "k6/execution";

const ITERATIONS = 500;

interface SetupData {
  assessmentIds: number[];
}

export function setup(): SetupData {
  const assessmentIds = workflowPrepareAssessmentData(ITERATIONS);
  return { assessmentIds };
}

export const options: Options = {
  scenarios: {
    submitAssessment: {
      executor: "shared-iterations",
      vus: 10,
      iterations: ITERATIONS,
      maxDuration: "1h",
    },
  },
  setupTimeout: "10m",
};

/**
 * Test scenario to executed as many times as defined by the test options.
 * Part of the K6 life cycle.
 * @param setupData setup data returned by setup method.
 */
export default function (setupData: SetupData) {
  const assessmentId =
    setupData.assessmentIds[execution.scenario.iterationInTest];
  console.log("starting assessment for", assessmentId);
  const submitResponse = workflowAssessmentSubmission(assessmentId);
  check(submitResponse, {
    "Created with success": (r) => r.status === 201,
  });
  sleep(1);
}
