import {
  WorkflowParentScopes,
  WorkflowServiceTasks,
} from "../constants/workflow-variables-constants";

export class WorkflowScopedServiceTask {
  constructor(task: WorkflowServiceTasks, ...scope: WorkflowParentScopes[]) {
    if (scope) {
      this._scopedServiceTaskId = [...scope, task].join("-");
    } else {
      this._scopedServiceTaskId = task;
    }
  }
  private _scopedServiceTaskId: string;
  get scopedServiceTaskId(): string {
    return this._scopedServiceTaskId;
  }
}

export const ExpectedServiceTasks = {
  associateWorkflowInstance: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.AssociateWorkflowInstance,
  ),
  loadAssessmentConsolidatedData: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.LoadAssessmentConsolidatedData,
  ),
  verifyApplicationExceptions: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.VerifyApplicationExceptions,
  ),
  updateApplicationStatusToInProgress: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.UpdateApplicationStatusToInProgress,
  ),
  programInfoRequired: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.ProgramInfoRequired,
  ),
  programInfoNotRequired: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.ProgramInfoNotRequired,
  ),
  studentCreateIncomeRequest: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.CreateIncomeRequest,
    WorkflowParentScopes.IncomeVerificationStudent,
  ),
  partnerCreateIncomeRequest: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.CreateIncomeRequest,
    WorkflowParentScopes.IncomeVerificationPartner,
  ),
  parent1CreateIncomeRequest: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.CreateIncomeRequest,
    WorkflowParentScopes.IncomeVerificationParent1,
  ),
  parent2CreateIncomeRequest: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.CreateIncomeRequest,
    WorkflowParentScopes.IncomeVerificationParent2,
  ),
  updateApplicationStatusToAssessment: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.UpdateApplicationStatusToAssessment,
  ),
  updateNOAStatusToRequired: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.UpdateNOAStatusToRequired,
  ),
  updateNOAStatusToNotRequired: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.UpdateNOAStatusToNotRequired,
  ),
  saveAssessmentData: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.SaveAssessmentData,
  ),
  saveAssessmentDataPartTime: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.SaveAssessmentDataPartTime,
  ),
  saveDisbursementSchedules: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.SaveDisbursementSchedules,
  ),
  saveDisbursementSchedulesPartTime: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.SaveDisbursementSchedulesPartTime,
  ),
  associateMSFAA: new WorkflowScopedServiceTask(
    WorkflowServiceTasks.AssociateMSFAA,
  ),
};
