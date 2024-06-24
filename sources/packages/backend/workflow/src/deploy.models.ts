export const PROCESSES_EXTENSION = ".bpmn";
export const DECISIONS_EXTENSION = ".dmn";
export const DEPLOYMENT_METADATA_PROPERTY_NAME = "Metadata";

export enum DeploymentMetadataTypes {
  DecisionRequirements = "decisionRequirements",
  Decision = "decision",
}

export interface DecisionDeploymentResult {
  requirementsId: string;
  requirementsName: string;
  requirementsKey: string;
  resourceName: string | undefined;
  metadata: string;
  version: number;
  deploymentKey: string;
}

export interface ProcessDeploymentResult {
  bpmnProcessId: string;
  processDefinitionKey: string;
  resourceName: string;
  version: number;
  deploymentKey: string;
}
