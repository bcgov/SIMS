import { LOAD_TEST_GATEWAY_CLIENT_SECRET } from "../../../config.env";
import { ClientSecretCredential } from "../auth";

/**
 * Get load test gateway client credentials.
 * @returns load test gateway client credentials.
 */
export function getLoadTestGatewayCredentials(): ClientSecretCredential {
  return {
    clientSecret: LOAD_TEST_GATEWAY_CLIENT_SECRET,
  };
}
