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

export enum WorkflowParentScopes {
  IncomeVerificationStudent = "income-verification-student",
  IncomeVerificationPartner = "income-verification-partner",
  IncomeVerificationParent1 = "income-verification-parent1",
  IncomeVerificationParent2 = "income-verification-parent2",
  RetrieveSupportingInfoPartner = "retrieve-supporting-info-partner",
  RetrieveSupportingInfoParent1 = "retrieve-supporting-info-parent1",
  RetrieveSupportingInfoParent2 = "retrieve-supporting-info-parent2",
}
