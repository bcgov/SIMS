/**
 * Methods like setup and default are part of the K6 life cycle.
 * @see https://k6.io/docs/using-k6/test-lifecycle
 * The exported options are part of the K6 configuration.
 * @see https://k6.io/docs/using-k6/k6-options
 */
import { check, sleep } from "k6";
import { getAPICall } from "../../../utils/sims-api/sims-api";
import { UserPasswordCredential } from "../../../utils/auth";
import { getInstitutionAdminCredentials } from "../../../utils/sims-api";

interface SetupData {
  credentials: UserPasswordCredential;
}

/**
 * Define test-run behavior.
 * Ramping up to 120 during 10s to allow Keycloak to
 * digest the requests. When all VUs are created at the
 * same time it was resulting on an Keycloak internal
 * server error (500).
 */
export const options = {
  stages: [
    { target: 120, duration: "10s" },
    { target: 120, duration: "10m" },
  ],
};

/**
 * Set up data for processing, share data among VUs.
 * Part of the K6 life cycle.
 * @returns data to be consumed
 */
export function setup(): SetupData {
  const credentials = getInstitutionAdminCredentials();
  return { credentials };
}

/**
 * Test scenario to executed as many times as defined by the test options.
 * Part of the K6 life cycle.
 * @param setupData setup data returned by setup method.
 */
export default function (setupData: SetupData) {
  const response = getAPICall(
    "institutions/institution",
    setupData.credentials
  );
  check(response, {
    "Retrieved with success": (r) => r.status === 200,
  });
  sleep(1);
}
