import "../../env-setup";
import * as fs from "fs";
import * as path from "path";
import {
  DecisionDeploymentResult,
  DECISIONS_EXTENSION,
  DEPLOYMENT_METADATA_PROPERTY_NAME,
  DeploymentMetadataTypes,
  ProcessDeploymentResult,
  PROCESSES_EXTENSION,
} from "./deploy.models";
import { Camunda8 } from "@camunda8/sdk";
import {
  DecisionDeployment,
  DecisionRequirementsDeployment,
  Deployment,
} from "@camunda8/sdk/dist/zeebe/types";

/**
 * Script main execution method.
 */
(async () => {
  console.info(`**** Deploying to Camunda ****\n`);
  console.info(`Deploying to Zeebe address ${process.env.ZEEBE_ADDRESS}`);
  console.info(`CAMUNDA_OAUTH_DISABLED ${process.env.CAMUNDA_OAUTH_DISABLED}`);
  console.info(
    `CAMUNDA_SECURE_CONNECTION ${process.env.CAMUNDA_SECURE_CONNECTION}`,
  );
  console.info(process.env);

  const directory = path.resolve(__dirname, `./workflow-definitions`);
  console.info(`Getting resources from ${directory}`);
  const fileNames: string[] = fs.readdirSync(directory);
  if (fileNames.length === 0) {
    console.info("No files found to be deployed!");
    return;
  }
  const filesPaths = fileNames.map((fileName) =>
    path.join(directory, fileName),
  );

  console.info(`\nFiles found:`);
  console.table(fileNames);
  console.table("Waiting...");
  const camunda8 = new Camunda8({
    zeebeGrpcSettings: {
      ZEEBE_GRPC_CLIENT_EAGER_CONNECT: true,
      ZEEBE_GRPC_CLIENT_CONNECTION_TOLERANCE_MS: 10000,
      ZEEBE_GRPC_CLIENT_RETRY: true,
      ZEEBE_GRPC_CLIENT_MAX_RETRIES: 20,
      ZEEBE_GRPC_CLIENT_MAX_RETRY_TIMEOUT_SECONDS: 10,
    },
  });
  const zeebeClient = camunda8.getZeebeGrpcApiClient();
  try {
    // Deploy all decision files (BPMNs).
    const decisionDeploymentResults: DecisionDeploymentResult[] = [];
    const decisionsFileNames = filesPaths.filter(
      (filePath) => path.extname(filePath) === DECISIONS_EXTENSION,
    );
    for (const decisionFilename of decisionsFileNames) {
      console.info(`Deploying decision: ${path.basename(decisionFilename)}`);
      const deploymentResult = await zeebeClient.deployResource({
        decisionFilename,
      });
      deploymentResult.deployments.forEach((deployment: Deployment) => {
        switch (deployment[DEPLOYMENT_METADATA_PROPERTY_NAME]) {
          case DeploymentMetadataTypes.DecisionRequirements:
            {
              const decisionRequirement =
                deployment as DecisionRequirementsDeployment;
              const decision = decisionRequirement.decisionRequirements;
              decisionDeploymentResults.push({
                requirementsId: decision.dmnDecisionRequirementsId,
                requirementsName: decision.dmnDecisionRequirementsName,
                requirementsKey: decision.decisionRequirementsKey,
                metadata: deployment[DEPLOYMENT_METADATA_PROPERTY_NAME],
                resourceName: path.basename(decision.resourceName),
                version: decision.version,
                deploymentKey: deploymentResult.key,
              });
            }
            break;
          case DeploymentMetadataTypes.Decision:
            {
              const decisionDeployment = deployment as DecisionDeployment;
              const decision = decisionDeployment.decision;
              decisionDeploymentResults.push({
                requirementsId: decision.dmnDecisionId,
                requirementsName: decision.dmnDecisionName,
                requirementsKey: decision.decisionRequirementsKey,
                metadata: deployment[DEPLOYMENT_METADATA_PROPERTY_NAME],
                resourceName: undefined,
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
      (filePath) => path.extname(filePath) === PROCESSES_EXTENSION,
    );
    for (const processFilename of processes) {
      console.info(`Deploying process: ${path.basename(processFilename)}`);
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
      "Please see below the definitions deployed (non-modified definitions will not generate a new version).",
    );

    console.info("\nSummary of decisions(DMN) deployments\n");
    console.table(decisionDeploymentResults);

    console.info("\nSummary of processes(BPMN) deployments\n");
    console.table(processesDeploymentResults);
  } catch (error: unknown) {
    console.error("Error while executing the deployment.");
    console.error(error);
    throw error;
  } finally {
    await zeebeClient.close();
  }
})();
