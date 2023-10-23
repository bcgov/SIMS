import http, { RefinedResponse, ResponseType } from "k6/http";
import { BASE_API_URL } from "../../../config.env";
import {
  AuthorizedParties,
  UserPasswordCredential,
  getCachedToken,
} from "../auth";

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
