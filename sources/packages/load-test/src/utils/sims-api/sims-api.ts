import http, { RefinedResponse, ResponseType } from "k6/http";
import {
  BASE_API_URL,
  KEY_CLOAK_TOKEN_URL,
  INSTITUTION_ADMIN_USER,
  INSTITUTION_ADMIN_PASSWORD,
} from "../../../config.env";
import { UserPasswordCredential, getCachedToken } from "../auth";

/**
 * Authorized parties recognized by the API.
 */
export enum AuthorizedParties {
  Institution = "institution",
  Student = "student",
  AEST = "aest",
  SupportingUsers = "supporting-users",
}

/**
 * Get the SIMS API token.
 * @returns SIMS API token.
 */
export function getAPIToken(authorizedParty: AuthorizedParties): string {
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  const payload = {
    grant_type: "password",
    client_id: authorizedParty,
    username: INSTITUTION_ADMIN_USER,
    password: INSTITUTION_ADMIN_PASSWORD,
  };
  const response = http.post(KEY_CLOAK_TOKEN_URL, payload, {
    headers,
  });
  const responseBody = JSON.parse(response.body.toString());
  return responseBody.access_token;
}

/**
 * Basic HTTP Get authenticated API call.
 * @param endpoint target relative endpoint.
 * @param credentials user credentials.
 * @returns HTTP Get call response.
 */
export function getAPICall(
  endpoint: string,
  credentials: UserPasswordCredential
): RefinedResponse<ResponseType> {
  const cachedToken = getCachedToken(
    AuthorizedParties.Institution,
    credentials
  );
  const headers = {
    Authorization: `Bearer ${cachedToken}`,
  };
  return http.get(`${BASE_API_URL}/${endpoint}`, {
    headers,
  });
}
