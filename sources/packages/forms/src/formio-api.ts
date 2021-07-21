import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config({ path: __dirname + "/../.env" });
const formsUrl = process.env.FORMS_URL;
const formsUserName = process.env.FORMS_SA_USER_NAME;
const formsPassword = process.env.FORMS_SA_PASSWORD;
// Expected header name to send the authorization token to formio API.
const FORMIO_TOKEN_NAME = "x-jwt-token";

/**
 * Creates the expected authorization header to authorize the formio API.
 * @returns header to be added to HTTP request.
 */
export const createAuthHeader = async () => {
  const token = await getAuthToken();
  return {
    headers: {
      [FORMIO_TOKEN_NAME]: token,
    },
  };
};

/**
 * Gets the authentication token value to authorize the formio API.
 * @returns the token that is needed to authentication on the formio API.
 */
const getAuthToken = async () => {
  const authResponse = await getUserLogin();
  return authResponse.headers[FORMIO_TOKEN_NAME];
};

/**
 * Executes the authentication on formio API.
 * @returns the result of a sucessfull authentication or thows an expection
 * in case the result is anything different from HTTP 200 code.
 */
const getUserLogin = async () => {
  try {
    const authRequest = await axios.post(`${formsUrl}/user/login`, {
      data: {
        email: formsUserName,
        password: formsPassword,
      },
    });
    return authRequest;
  } catch (error) {
    console.error("Received exception while getting form SA token");
    console.error(error);
    throw error;
  }
};

/**
 * Checks if a form definition is already present on Form.IO server.
 * @param formAlias form alias to be checked.
 * @param authHeader authentication header.
 * @returns true if the form is present, otherwise false if a the
 * http response is not successful.
 */
export const isFormDeployed = async (
  formAlias: string,
  authHeader: any
): Promise<boolean> => {
  try {
    const authRequest = await axios.get(`${formsUrl}/${formAlias}`, authHeader);
    return authRequest.status === 200;
  } catch (error) {
    return false;
  }
};

/**
 * Updates a form definition on Form.IO server.
 * Case the definition is not present this method will fail.
 * @param formAlias form alias to be updated.
 * @param formDefinition form definition to be upated.
 * @param authHeader authentication header.
 */
export const updateForm = async (
  formAlias: string,
  formDefinition: any,
  authHeader: any
): Promise<void> => {
  try {
    await axios.put(`${formsUrl}/${formAlias}`, formDefinition, authHeader);
  } catch (error) {
    console.error("Error updating the form definition.");
    console.error(error);
    throw error;
  }
};

/**
 * Creates a form definition on Form.IO server.
 * Case the definition is present this method will fail.
 * @param formDefinition form definition to be upated.
 * @param authHeader authentication header.
 */
export const createForm = async (
  formDefinition: any,
  authHeader: any
): Promise<void> => {
  try {
    await axios.post(`${formsUrl}/form`, formDefinition, authHeader);
  } catch (error) {
    console.error("Error creating the form definition.");
    console.error(error);
    throw error;
  }
};
