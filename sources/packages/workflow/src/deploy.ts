import * as fs from "fs";
import * as path from "path";
import {
  DecisionDeployment,
  DecisionRequirementsDeployment,
  Deployment,
  ZBClient,
} from "zeebe-node";
import * as dotenv from "dotenv";
import {
  DecisionDeploymentResult,
  DECISIONS_EXTENSION,
  DEPLOYMENT_METADATA_TYPE,
  DeployMetadataTypes,
  ProcessDeploymentResult,
  PROCESSES_EXTENSION,
} from "./deploy.models";

dotenv.config({ path: path.join(__dirname, "../../../../.env") });

/**
 * Script main execution method.
 */
(async () => {
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
    // Deploy all decision files (BPMNs).
    const decisionDeploymentResults: DecisionDeploymentResult[] = [];
    const decisionsFileNames = filesPaths.filter(
      (filePath) => path.extname(filePath) === DECISIONS_EXTENSION
    );
    for (const decisionFilename of decisionsFileNames) {
      const deploymentResult = await zeebeClient.deployResource({
        decisionFilename,
      });
      deploymentResult.deployments.forEach((deployment: Deployment) => {
        switch (deployment[DEPLOYMENT_METADATA_TYPE]) {
          case DeployMetadataTypes.DecisionRequirements:
            {
              const decisionRequirement =
                deployment as DecisionRequirementsDeployment;
              const decision = decisionRequirement.decisionRequirements;
              decisionDeploymentResults.push({
                requirementsId: decision.dmnDecisionRequirementsId,
                requirementsName: decision.dmnDecisionRequirementsName,
                requirementsKey: decision.decisionRequirementsKey,
                metadata: deployment[DEPLOYMENT_METADATA_TYPE],
                resourceName: path.basename(decision.resourceName),
                version: decision.version,
                deploymentKey: deploymentResult.key,
              });
            }
            break;
          case DeployMetadataTypes.Decision:
            {
              const decisionDeployment = deployment as DecisionDeployment;
              const decision = decisionDeployment.decision;
              decisionDeploymentResults.push({
                requirementsId: decision.dmnDecisionId,
                requirementsName: decision.dmnDecisionName,
                requirementsKey: decision.decisionRequirementsKey,
                metadata: deployment[DEPLOYMENT_METADATA_TYPE],
                resourceName: null,
                version: decision.version,
                deploymentKey: deploymentResult.key,
              });
            }
            break;
          default:
            console.warn("\nUnknown metadata\n");
            console.warn(deployment);
            break;
        }
      });
    }

    // Deploy all processes (BPMNs).
    const processesDeploymentResults: ProcessDeploymentResult[] = [];
    const processes = filesPaths.filter(
      (filePath) => path.extname(filePath) === PROCESSES_EXTENSION
    );
    for (const processFilename of processes) {
      const deploymentResult = await zeebeClient.deployResource({
        processFilename,
      });
      const results = deploymentResult.deployments.map((deployment) => ({
        bpmnProcessId: deployment.process.bpmnProcessId,
        processDefinitionKey: deployment.process.processDefinitionKey,
        resourceName: path.basename(deployment.process.resourceName),
        version: deployment.process.version,
        deploymentKey: deploymentResult.key,
      }));
      processesDeploymentResults.push(...results);
    }

    console.info(`\nDeployment successful!\n`);
    console.info(
      "Please see below the definitions deployed (non-modified definitions will not generate a new version).\n"
    );

    console.info("\nSummary of decisions(DMN) deployments\n");
    console.table(decisionDeploymentResults);

    console.info("\nSummary of processes(BPMN) deployments\n");
    console.table(processesDeploymentResults);
  } catch (error: unknown) {
    console.error("Error while executing the deployment.");
    console.error(error);
    throw error;
  }
})();
