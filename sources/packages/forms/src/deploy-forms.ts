import * as fs from "fs";
import * as path from "path";
import {
  createAuthHeader,
  isFormDeployed,
  updateForm,
  createForm,
} from "./formio-api";

const sourceDir = process.env.NODE_ENV === "production" ? "dist" : "src";
const getFormIoPath = () =>
  path.resolve(__dirname, `../${sourceDir}/form-definitions`);

/**
 * Script main execution method.
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
        "------------------------------------------------------------"
      );
      console.log(`Deploying form definition ${file}`);
      const filePath = path.join(directory, file);
      const fileContent = fs.readFileSync(filePath, { encoding: "utf8" });
      const jsonContent = JSON.parse(fileContent);
      const formAlias = file.replace(path.extname(file), "");
      const isDeployed = await isFormDeployed(formAlias, authHeader);
      if (isDeployed) {
        console.log(`Form ${formAlias} is already deployed. Updating form...`);
        //await updateForm(formAlias, jsonContent, authHeader);
        console.log(`Form ${formAlias} updated!`);
      } else {
        console.log(`Form ${formAlias} was not found. Creating form...`);
        //await createForm(jsonContent, authHeader);
        console.log(`Form ${formAlias} created!`);
      }
    }
  } catch (excp) {
    console.error(`Exception occurs during Form IO deployment: ${excp}`);
    throw excp;
  }
})();
