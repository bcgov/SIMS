/**
 * Methods like setup and default are part of the K6 life cycle.
 * @see https://k6.io/docs/using-k6/test-lifecycle
 * The exported options are part of the K6 configuration.
 * @see https://k6.io/docs/using-k6/k6-options
 */
import { check, sleep } from "k6";
import { loadTestPostCall } from "../../utils/load-test-api/load-test-api";
import { getLoadTestGatewayCredentials } from "../../utils/load-test-api/load-test-api-creds";
import { Options } from "k6/options";
import execution from "k6/execution";
import {
  patchStudentAPICall,
  getStudentCredentials,
} from "../../utils/sims-api";
import { UserPasswordCredential } from "../../utils/auth";
import { E2E_TEST_STUDENT_USERNAME } from "../../../config.env";

/**
 * Load test number of iterations to run.
 * Can be overridden via k6 -e ITERATIONS=<n>.
 */
const ITERATIONS = parseInt(__ENV.ITERATIONS || "500");
/**
 * Virtual users to run load test.
 * Please ensure that the number of virtual users
 * must always be less than the iterations.
 * Can be overridden via k6 -e VIRTUAL_USERS=<n>.
 */
const VIRTUAL_USERS = Math.min(
  parseInt(__ENV.VIRTUAL_USERS || "15"),
  ITERATIONS,
);
/**
 * Maximum number of draft applications to create per setup request.
 * Batching prevents HTTP and database timeouts when ITERATIONS is large.
 * Can be overridden via k6 -e SETUP_BATCH_SIZE=<n>.
 */
const SETUP_BATCH_SIZE = parseInt(__ENV.SETUP_BATCH_SIZE || "500");

/**
 * Per-iteration data returned by the gateway setup endpoint.
 */
interface ApplicationSetupData {
  applicationId: number;
  offeringId: number;
  programId: number;
  locationId: number;
  programYearId: number;
}

interface SetupData {
  setupItems: ApplicationSetupData[];
  studentCredentials: UserPasswordCredential;
  applicationData: Record<string, unknown>;
}

/**
 * Load all the required draft applications to be submitted during
 * the load test execution. Requests are batched to avoid HTTP and
 * database timeouts when the number of iterations is large.
 * @returns setup data.
 */
export function setup(): SetupData {
  const gatewayCredentials = getLoadTestGatewayCredentials();
  const setupItems: ApplicationSetupData[] = [];
  let applicationData: Record<string, unknown> = {};
  let remaining = ITERATIONS;
  while (remaining > 0) {
    const batchSize = Math.min(remaining, SETUP_BATCH_SIZE);
    const response = loadTestPostCall(
      `application-submission/setup/${batchSize}`,
      gatewayCredentials,
      { payload: { studentUserName: E2E_TEST_STUDENT_USERNAME } },
    );
    const batch = response.json() as unknown as {
      applications: ApplicationSetupData[];
      applicationData: Record<string, unknown>;
    };
    for (const item of batch.applications) {
      setupItems.push(item);
    }
    applicationData = batch.applicationData;
    remaining -= batchSize;
  }
  return { setupItems, studentCredentials: getStudentCredentials(), applicationData };
}

export const options: Options = {
  scenarios: {
    submitApplication: {
      executor: "shared-iterations",
      vus: VIRTUAL_USERS,
      iterations: ITERATIONS,
      maxDuration: "30m",
    },
  },
};

/**
 * Test scenario to be executed as many times as defined by the test options.
 * Part of the K6 life cycle.
 * @param setupData setup data returned by setup method.
 */
export default function (setupData: SetupData) {
  const { applicationId, offeringId, programId, locationId, programYearId } =
    setupData.setupItems[execution.scenario.iterationInTest];
  const payload = {
    associatedFiles: [] as string[],
    programYearId: Number(programYearId),
    data: {
      ...setupData.applicationData,
      selectedOffering: offeringId,
      selectedProgram: programId,
      selectedLocation: locationId,
    },
  };
  const submitResponse = patchStudentAPICall(
    `api/students/application/${applicationId}/submit`,
    setupData.studentCredentials,
    payload,
  );
  const submitted = check(submitResponse, {
    "Submitted with success": (r) => r.status === 200,
  });
  if (!submitted) {
    console.error(
      `Application ${applicationId} failed — status: ${submitResponse.status}, body: ${submitResponse.body}`,
    );
  }
  sleep(1);
}
