export interface WorkflowStartResult {
  id: string;
  definitionId: string;
  businessKey: string;
  caseInstanceId: string;
  ended: true;
  suspended: boolean;
  tenantId: string;
}
