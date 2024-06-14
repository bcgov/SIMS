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
 * Partition status value to define it as ready to accept Zeebe commands.
 */
const ZEEBE_PARTITION_HEALTH_STATUS = "HEALTHY";
/**
 * Attempts to verify it Zeebe is ready to accept commands.
 */
const ZEEBE_PARTITION_HEALTH_MAX_ATTEMPTS = 20;
/**
 * Interval between each health check.
 */
const ZEEBE_HEALTH_CHECK_ATTEMPTS_INTERVAL = 1000;
/**
 * Indentation do log JSON objects in a user friendly way.
 */
const JSON_LOG_INDENTATION = 2;

/**
 * Script main execution method.
 */
(async () => {
  console.info(`**** Deploying to Camunda ****\n`);
  console.info(`Deploying to Zeebe address ${process.env.ZEEBE_ADDRESS}`);

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

  const camunda8 = new Camunda8();
  const zeebeClient = camunda8.getZeebeGrpcApiClient();
  // Wait till Zeebe is ready to receive commands.
  let isHealthy = false;
  let attempts = 0;
  while (!isHealthy) {
    console.info(`\nChecking if Zeebe is ready to accept commands.`);
    const topology = await zeebeClient.topology();
    isHealthy = topology.brokers.every(
      (broker) =>
        broker.partitions.length > 0 &&
        broker.partitions.every(
          (partition) =>
            partition.health.toString() === ZEEBE_PARTITION_HEALTH_STATUS,
        ),
    );
    if (isHealthy) {
      console.info("Zeebe is ready.");
    } else if (++attempts < ZEEBE_PARTITION_HEALTH_MAX_ATTEMPTS) {
      console.warn(
        `Zeebe is not ready. Waiting for Zeebe to be ready, attempt ${attempts} of ${ZEEBE_PARTITION_HEALTH_MAX_ATTEMPTS}.`,
      );
      console.debug(`Current topology:`);
      console.debug(JSON.stringify(topology, null, JSON_LOG_INDENTATION));
      // Wait one second before trying again.
      await new Promise((f) =>
        setTimeout(f, ZEEBE_HEALTH_CHECK_ATTEMPTS_INTERVAL),
      );
    } else {
      throw new Error(
        "Zeebe was not able to be ready to accept the deployment.",
      );
    }
  }

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
