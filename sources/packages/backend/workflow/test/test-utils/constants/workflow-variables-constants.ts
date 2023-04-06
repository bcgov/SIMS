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
}

/**
 * Workflow activities invoked as subprocesses using a 'Call Activity' task.
 * The values of the enums are also included as output variables in the
 * workflow 'Call Activity' to help the E2E tests to correctly determine if
 * the workflow execution passed through those tasks.
 */
export enum WorkflowSubprocesses {
  LoadConsolidatedDataSubmitOrReassessment = "loadConsolidatedDataOnSubmitOrReassessmentSubprocess",
  LoadConsolidatedDataPreAssessment = "loadConsolidatedDataPreAssessmentSubprocess",
  StudentIncomeVerification = "studentIncomeVerificationSubprocess",
  RetrieveSupportingInfoPartner = "retrieveSupportingInfoPartnerSubprocess",
  RetrieveSupportingInfoParent1 = "retrieveSupportingInfoParent1Subprocess",
  RetrieveSupportingInfoParent2 = "retrieveSupportingInfoParent2Subprocess",
  PartnerIncomeVerification = "partnerIncomeVerificationSubprocess",
  Parent1IncomeVerification = "parent1IncomeVerificationSubprocess",
  Parent2IncomeVerification = "parent2IncomeVerificationSubprocess",
}
