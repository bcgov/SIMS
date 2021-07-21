require("../env_setup");
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

const formDefinitionsPath = "api/forms";
const formsUrl = process.env.FORMS_URL;
const formsUserName = process.env.FORMS_SA_USER_NAME;
const formsPassword = process.env.FORMS_SA_PASSWORD;
// Expected header name to send the authorization token to formio API.
const FORMIO_TOKEN_NAME = "x-jwt-token";

const getFormIoPath = () =>
  path.resolve(__dirname, `../../${formDefinitionsPath}`);

/**
 * Creates the expected authorization header to authorize the formio API.
 * @returns header to be added to HTTP request.
 */
const createAuthHeader = async () => {
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
  }
};

const isFormDeployed = async (
  formAlias: string,
  authHeader: any,
): Promise<boolean> => {
  try {
    const authRequest = await axios.get(`${formsUrl}/${formAlias}`, authHeader);
    return authRequest.status === 200;
  } catch (error) {
    return false;
  }
};

const updateForm = async (
  formAlias: string,
  formDefinition: any,
  authHeader: any,
): Promise<void> => {
  try {
    await axios.put(`${formsUrl}/${formAlias}`, formDefinition, authHeader);
  } catch (error) {
    console.error("Error updating the form definition.");
    console.error(error);
    throw error;
  }
};

const createForm = async (
  formAlias: string,
  formDefinition: any,
  authHeader: any,
): Promise<void> => {
  try {
    await axios.post(`${formsUrl}/form`, formDefinition, authHeader);
  } catch (error) {
    console.error("Error creating the form definition.");
    console.error(error);
    throw error;
  }
};

/**
 * Script main execution method
 */
(async () => {
  try {
    console.log("**** Deploying Form IO Definitions ****");
    const directory = getFormIoPath();
    console.log(`Getting form definitions from ${directory}`);
    const files: string[] = fs.readdirSync(directory);

    if (files.length === 0) {
      console.log("No files found to be deployed!");
      return;
    }

    console.log("Acquiring access token...");
    const authHeader = await createAuthHeader();

    for (const file of files) {
      console.log(
        "------------------------------------------------------------",
      );
      console.log(`Deploying form definition ${file}`);
      const filePath = path.join(directory, file);
      const fileContent = fs.readFileSync(filePath, { encoding: "utf8" });
      const jsonContent = JSON.parse(fileContent);
      const formAlias = file.replace(path.extname(file), "");
      const isDeployed = await isFormDeployed(formAlias, authHeader);
      if (isDeployed) {
        console.log(`Form ${formAlias} is already deployed. Updating form...`);
        await updateForm(formAlias, jsonContent, authHeader);
        console.log(`Form ${formAlias} updated!`);
      } else {
        console.log(`Form ${formAlias} was not found. Creating form...`);
        await createForm(formAlias, jsonContent, authHeader);
        console.log(`Form ${formAlias} created!`);
      }
    }
  } catch (excp) {
    console.error(`Exception occurs during Form IO deployment: ${excp}`);
    throw excp;
  }
})();
