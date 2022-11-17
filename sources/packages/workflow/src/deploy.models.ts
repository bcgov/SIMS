export const PROCESSES_EXTENSION = ".bpmn";
export const DECISIONS_EXTENSION = ".dmn";
export const DEPLOYMENT_METADATA_TYPE = "Metadata";

export enum DeployMetadataTypes {
  DecisionRequirements = "decisionRequirements",
  Decision = "decision",
}

export interface DecisionDeploymentResult {
  requirementsId: string;
  requirementsName: string;
  requirementsKey: number;
  resourceName: string;
  metadata: string;
  version: number;
  deploymentKey: number;
}

export interface ProcessDeploymentResult {
  bpmnProcessId: string;
  processDefinitionKey: string;
  resourceName: string;
  version: number;
  deploymentKey: number;
}
