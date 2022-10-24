import * as fs from "fs";
import * as path from "path";
import {
  createAuthHeader,
  isFormDeployed,
  updateForm,
  createForm,
} from "./formio-api";

/**
 * Deployment information used for logging purposes only.
 */
interface FormDeployInfo {
  formAlias: string;
  result: "updated" | "created" | "error";
}

/**
 * Script main execution method.
 */
(async () => {
  try {
    console.info(
      `**** Deploying Form IO Definitions to ${process.env.FORMS_URL} ****`
    );
    const directory = path.resolve(__dirname, `../src/form-definitions`);
    console.info(`Getting form definitions from ${directory}`);
    const files: string[] = fs.readdirSync(directory);

    if (files.length === 0) {
      console.info("No files found to be deployed!");
      return;
    }

    console.info("Acquiring access token...");
    const authHeader = await createAuthHeader();

    const formDeployStatuses: FormDeployInfo[] = [];
    for (const file of files) {
      console.info(`Deploying form definition ${file}`);
      const filePath = path.join(directory, file);
      const fileContent = fs.readFileSync(filePath, { encoding: "utf8" });
      const jsonContent = JSON.parse(fileContent);
      const formAlias = file.replace(path.extname(file), "");
      const isDeployed = await isFormDeployed(formAlias, authHeader);

      const formDeployStatus = { formAlias } as FormDeployInfo;
      try {
        if (isDeployed) {
          // TODO: Enable it back, temporarily disabled for testing.
          // await updateForm(formAlias, jsonContent, authHeader);
          formDeployStatus.result = "updated";
        } else {
          // TODO: Enable it back, temporarily disabled for testing.
          // await createForm(jsonContent, authHeader);
          formDeployStatus.result = "created";
        }
      } catch (error) {
        formDeployStatus.result = "error";
        // Case an error happen, log and try to continue.
        console.error(
          `Error while ${
            isDeployed ? "updating" : "creating"
          } form ${formAlias}`
        );
      }
      formDeployStatuses.push(formDeployStatus);
    }
    console.table(formDeployStatuses);
  } catch (error: unknown) {
    console.error(`Exception occurs during Form IO deployment: ${error}`);
    throw error;
  }
})();
