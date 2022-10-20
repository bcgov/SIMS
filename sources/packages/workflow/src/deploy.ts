import * as fs from "fs";
import * as path from "path";
import { ZBClient } from "zeebe-node";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../../../../.env") });

/**
 * Script main execution method.
 */
(async () => {
  try {
    console.info(`**** Deploying to Camunda ****\n`);
    console.info(`Deploying to Zeebe address ${process.env.ZEEBE_ADDRESS}`);

    const directory = path.resolve(__dirname, `../BPMN/camunda-8`);
    console.info(`Getting resources from ${directory}`);
    const fileNames: string[] = fs.readdirSync(directory);
    if (fileNames.length === 0) {
      console.info("No files found to be deployed!");
      return;
    }
    const filesPaths = fileNames.map((fileName) =>
      path.join(directory, fileName)
    );
    console.info(`Files found: ${fileNames.join(", ")}`);
    const zeebeClient = new ZBClient();
    try {
      const deploymentResults = await zeebeClient.deployProcess(filesPaths);
      console.info(`\nDeployment successful!\n`);
      console.info(
        "Please see below the definitions deployed (non-modified definitions will not generate a new version)."
      );
      console.table(deploymentResults.processes);
      console.info(`Deployment key: ${deploymentResults.key}`);
    } catch (error: unknown) {
      console.error("Error while executing the deployment.");
      console.error(error);
    }
  } catch (error) {
    console.error(`Exception occurs during Form IO deployment: ${error}`);
    throw error;
  }
})();
