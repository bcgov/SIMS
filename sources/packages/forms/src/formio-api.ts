import * as dotenv from "dotenv";
import axios, { AxiosRequestConfig } from "axios";
import { join } from "path";

dotenv.config({ path: join(__dirname, "./../../../.env") });
const formsUrl = process.env.FORMS_URL;
const formsApiKey = process.env.FORMS_API_KEY;
// Expected header name to send the authorization token to formio API.
const FORMIO_TOKEN_NAME = "x-token";

/**
 * Creates the expected authorization header to authorize the formio API.
 * @returns header to be added to HTTP request.
 */
export const createAuthHeader = (): AxiosRequestConfig => {
  if (!formsApiKey) {
    throw new Error(
      "Form API key is not set. Please set the FORMS_API_KEY environment variable.",
    );
  }
  return {
    headers: {
      [FORMIO_TOKEN_NAME]: formsApiKey,
    },
  };
};

/**
 * Checks if a form definition is already present on Form.IO server.
 * @param formAlias form alias to be checked.
 * @param authHeader authentication header.
 * @returns true if the form is present, otherwise false if the
 * HTTP response is not successful.
 */
export const isFormDeployed = async (
  formAlias: string,
  authHeader: AxiosRequestConfig,
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
  authHeader: AxiosRequestConfig,
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
  authHeader: AxiosRequestConfig,
): Promise<void> => {
  try {
    await axios.post(`${formsUrl}/form`, formDefinition, authHeader);
  } catch (error) {
    console.error("Error creating the form definition.");
    console.error(error);
    throw error;
  }
};
