import http, { RefinedResponse, ResponseType } from "k6/http";
import { BASE_LOAD_TEST_GATEWAY_URL } from "../../../config.env";
import {
  AuthorizedParties,
  ClientSecretCredential,
  getCachedToken,
} from "../auth";

const LOAD_TEST_GATEWAY_CLIENT_HTTP_TIMEOUT = "120s";

/**
 * Load assessment data required to execute a load test.
 * @param iterations load test iterations.
 * @param credentials load test gateway client credentials.
 * @returns created assessment ids.
 */
export function workflowLoadAssessmentData(
  iterations: number,
  credentials: ClientSecretCredential
): number[] {
  const headers = getAuthHeader(credentials);
  const response = http.post(
    `${BASE_LOAD_TEST_GATEWAY_URL}/workflow/prepare-assessment-data/${iterations}`,
    undefined,
    { headers, timeout: LOAD_TEST_GATEWAY_CLIENT_HTTP_TIMEOUT }
  );
  const data = response.json() as number[];
  return data;
}
/**
 * Submit an assessment for workflow execution.
 * @param assessmentId assessment id.
 * @param credentials load test gateway client credentials.
 * @returns response.
 */
export function workflowAssessmentSubmission(
  assessmentId: number,
  credentials: ClientSecretCredential
): RefinedResponse<ResponseType> {
  const headers = getAuthHeader(credentials);
  return http.patch(
    `${BASE_LOAD_TEST_GATEWAY_URL}/workflow/submit-assessment/${assessmentId}`,
    undefined,
    { headers, timeout: LOAD_TEST_GATEWAY_CLIENT_HTTP_TIMEOUT }
  );
}

/**
 * Get auth header for load test gateway.
 * @param credentials load test gateway client credentials.
 * @returns auth header.
 */
function getAuthHeader(credentials: ClientSecretCredential): {
  Authorization: string;
} {
  const cachedToken = getCachedToken(
    AuthorizedParties.LoadTestGateway,
    credentials
  );
  return {
    Authorization: `Bearer ${cachedToken}`,
  };
}
