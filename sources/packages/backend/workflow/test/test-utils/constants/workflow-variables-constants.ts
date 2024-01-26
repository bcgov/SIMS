/**
 * Service tasks ids present on the workflows.
 */
export enum WorkflowServiceTasks {
  // Workflow - Assessment Gateway
  AssociateWorkflowInstance = "associate-workflow-instance-task",
  LoadAssessmentConsolidatedData = "load-assessment-data-task",
  VerifyApplicationExceptions = "verify-application-exceptions-task",
  UpdateApplicationStatusToInProgress = "update-application-status-to-in-progress-task",
  ProgramInfoRequired = "program-info-required-task",
  ProgramInfoNotRequired = "program-info-not-required-task",
  CreateSupportingUserPartnerTask = "create-supporting-user-for-the-partner-task",
  CreateSupportingUsersParentsTask = "create-supporting-users-for-parents-task",
  UpdateApplicationStatusToAssessment = "update-application-status-to-assessment-task",
  UpdateNOAStatusToRequired = "update-noa-status-to-required-task",
  UpdateNOAStatusToNotRequired = "update-noa-status-to-not-required-task",
  SaveAssessmentData = "save-assessment-data-task",
  SaveAssessmentDataPartTime = "save-assessment-data-part-time-task",
  SaveDisbursementSchedules = "save-disbursement-task",
  SaveDisbursementSchedulesPartTime = "save-disbursement-part-time-task",
  AssociateMSFAA = "associate-msfaa-task",
  // Workflow - CRA Integration Income Verification
  CreateIncomeRequest = "create-income-request-task",
  CheckIncomeRequest = "check-income-request-task",
  // Workflow - Supporting User Information Request
  CheckSupportingUserResponseTask = "check-supporting-user-response-task",
  WorkflowWrapUpTask = "workflow-wrap-up-task",
  VerifyAssessmentCalculationOrderTask = "verify-assessment-calculation-order-task",
}

/**
 * Workflow activities invoked as subprocesses using a 'Call Activity' task.
 * The values of the enums are also included as output variables in the
 * workflow 'Call Activity' to help the E2E tests to correctly determine if
 * the workflow execution passed through those tasks.
 */
export enum WorkflowSubprocesses {
  LoadConsolidatedDataSubmitOrReassessment = "load-assessment-data-submit-or-reassessment-subprocess",
  LoadConsolidatedDataPreAssessment = "load-assessment-data-pre-assessment-subprocess",
  StudentIncomeVerification = "student-income-verification-subprocess",
  RetrieveSupportingInfoPartner = "retrieve-supporting-info-for-partner-subprocess",
  RetrieveSupportingInfoParent1 = "retrieve-supporting-info-for-parent-1-subprocess",
  RetrieveSupportingInfoParent2 = "retrieve-supporting-info-for-parent-2-subprocess",
  PartnerIncomeVerification = "partner-income-verification-subprocess",
  Parent1IncomeVerification = "parent-1-income-verification-subprocess",
  Parent2IncomeVerification = "parent-2-income-verification-subprocess",
}
