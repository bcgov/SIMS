import http, { RefinedResponse, ResponseType } from "k6/http";
import { BASE_API_URL } from "../../../config.env";
import {
  AuthorizedParties,
  UserPasswordCredential,
  getCachedToken,
} from "../auth";

/**
 * Basic HTTP Get authenticated API call using institution credentials.
 * @param endpoint target relative endpoint.
 * @param credentials user credentials.
 * @returns HTTP Get call response.
 */
export function getInstitutionAPICall(
  endpoint: string,
  credentials: UserPasswordCredential,
): RefinedResponse<ResponseType> {
  const cachedToken = getCachedToken(
    AuthorizedParties.Institution,
    credentials,
  );
  const headers = {
    Authorization: `Bearer ${cachedToken}`,
  };
  return http.get(`${BASE_API_URL}/${endpoint}`, {
    headers,
  });
}

/**
 * Basic HTTP Patch authenticated API call using student credentials.
 * @param endpoint target relative endpoint.
 * @param credentials student user credentials.
 * @param body request body to send.
 * @returns HTTP Patch call response.
 */
export function patchStudentAPICall(
  endpoint: string,
  credentials: UserPasswordCredential,
  body: unknown,
): RefinedResponse<ResponseType> {
  const cachedToken = getCachedToken(AuthorizedParties.Student, credentials);
  const headers = {
    Authorization: `Bearer ${cachedToken}`,
    "Content-Type": "application/json",
  };
  return http.patch(`${BASE_API_URL}/${endpoint}`, JSON.stringify(body), {
    headers,
  });
}
