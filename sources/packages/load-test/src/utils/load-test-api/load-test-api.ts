import http, { RefinedResponse, ResponseType } from "k6/http";
import { BASE_LOAD_TEST_GATEWAY_URL } from "../../../config.env";
import {
  AuthorizedParties,
  ClientSecretCredential,
  getCachedToken,
} from "../auth";

const LOAD_TEST_GATEWAY_CLIENT_HTTP_TIMEOUT = "120s";

/**
 * Call the post endpoint of load test gateway.
 * @param endpoint load test endpoint.
 * @param credentials load test gateway client credentials.
 * @param options load test post call options.
 * - `payload` payload.
 * @returns response.
 */
export function loadTestPostCall(
  endpoint: string,
  credentials: ClientSecretCredential,
  options?: { payload?: unknown }
): RefinedResponse<ResponseType> {
  const payload = options?.payload
    ? JSON.stringify(options.payload)
    : undefined;
  const headers = getAuthHeader(credentials);
  return http.post(`${BASE_LOAD_TEST_GATEWAY_URL}/${endpoint}`, payload, {
    headers,
    timeout: LOAD_TEST_GATEWAY_CLIENT_HTTP_TIMEOUT,
  });
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
