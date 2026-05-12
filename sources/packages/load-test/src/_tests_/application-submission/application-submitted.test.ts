/**
 * Application submitted test: creates submitted applications directly in the database
 * across multiple fake students, bypassing the student API endpoint entirely.
 * Queue-consumers detect the submitted applications on their next scheduled run
 * and enqueue Camunda workflow instances, which workers then process.
 *
 * Distributing across multiple students prevents all workflow instances from
 * sharing the same Camunda process tree, enabling better parallelism in workers
 * and more realistic load against the workers pipeline.
 *
 * @see https://k6.io/docs/using-k6/test-lifecycle
 * @see https://k6.io/docs/using-k6/k6-options
 */
import { check } from "k6";
import { loadTestPostCall } from "../../utils/load-test-api/load-test-api";
import { getLoadTestGatewayCredentials } from "../../utils/load-test-api/load-test-api-creds";
import { Options } from "k6/options";

/**
 * Total number of submitted applications to create for workers to process.
 * Can be overridden via k6 -e ITERATIONS=<n>.
 */
const ITERATIONS = Number.parseInt(__ENV.ITERATIONS || "500");
/**
 * Number of distinct fake students to spread applications across.
 * More students means more independent Camunda workflow branches.
 * Can be overridden via k6 -e NUMBER_OF_STUDENTS=<n>.
 */
const NUMBER_OF_STUDENTS = Number.parseInt(__ENV.NUMBER_OF_STUDENTS || "10");
/**
 * Maximum number of applications to create per gateway request.
 * Batching prevents HTTP and database timeouts when ITERATIONS is large.
 * Can be overridden via k6 -e SETUP_BATCH_SIZE=<n>.
 */
const SETUP_BATCH_SIZE = Number.parseInt(__ENV.SETUP_BATCH_SIZE || "500");

/**
 * Response shape returned by the setup/submitted gateway endpoint.
 */
interface ApplicationSubmittedSetupResponse {
  totalApplicationsCreated: number;
}

/**
 * Creates all submitted applications during the setup phase so workers can
 * begin processing as soon as the queue-consumers scheduler runs.
 * @returns the total number of submitted applications created.
 */
export function setup(): number {
  const gatewayCredentials = getLoadTestGatewayCredentials();
  let totalCreated = 0;
  let remaining = ITERATIONS;
  while (remaining > 0) {
    const batchSize = Math.min(remaining, SETUP_BATCH_SIZE);
    let response: ReturnType<typeof loadTestPostCall> | undefined;
    // Retry up to 3 times on transient gateway/DB connection errors.
    for (let attempt = 1; attempt <= 3; attempt++) {
      response = loadTestPostCall(
        `application-submission/setup/submitted/${batchSize}`,
        gatewayCredentials,
        { payload: { numberOfStudents: NUMBER_OF_STUDENTS } },
      );
      if (response.status >= 200 && response.status < 300) {
        break;
      }
      console.warn(
        `Application submitted setup batch attempt ${attempt} failed — status: ${response.status}. Retrying...`,
      );
      if (attempt === 3) {
        throw new Error(
          `Application submitted setup batch failed after 3 attempts — status: ${response.status}, body: ${response.body}`,
        );
      }
    }
    const batch =
      response!.json() as unknown as ApplicationSubmittedSetupResponse;
    totalCreated += batch.totalApplicationsCreated;
    remaining -= batchSize;
  }
  console.log(
    `Application submitted test setup complete: ${totalCreated} submitted applications created across ${NUMBER_OF_STUDENTS} students.`,
  );
  return totalCreated;
}

export const options: Options = {
  setupTimeout: "10m",
  scenarios: {
    applicationSubmitted: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 1,
      maxDuration: "5m",
    },
  },
};

/**
 * Verifies that the setup created the expected number of submitted applications.
 * The workers pipeline processes them independently once queue-consumers picks them up.
 * @param totalCreated total applications created by the setup phase.
 */
export default function applicationSubmitted(totalCreated: number): void {
  check(totalCreated, {
    "All applications were created": (n) => n === ITERATIONS,
  });
  console.log(
    `${totalCreated} submitted applications are queued for workers to process.`,
  );
}
