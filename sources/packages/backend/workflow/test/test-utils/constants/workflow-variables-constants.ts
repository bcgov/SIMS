/**
 * E2E test variable used by load consolidated data worker to set the values for
 * student dependent status and relationship status.
 */
export const E2E_STUDENT_STATUS = "e2eTestStudentStatus";

/**
 * E2E test variable used by load consolidated data worker to set the value of
 * application exception status.
 */
export const E2E_APPLICATION_EXCEPTION_STATUS =
  "e2eTestApplicationExceptionStatus";

/**
 * E2E test variable used by load consolidated data worker to set the value of
 * application PIR status.
 */
export const E2E_PIR_STATUS = "e2ePIRStatus";

export enum WorkflowServiceTasks {
  AssociateWorkflowInstance = "associate-workflow-instance-task",
  VerifyApplicationExceptions = "verify-application-exceptions-task",
  UpdateApplicationStatusToInProgress = "update-application-status-to-in-progress-task",
  ProgramInfoRequired = "program-info-required-task",
  ProgramInfoNotRequired = "program-info-not-required-task",
  CreateIncomeRequest = "create-income-request",
  CheckIncomeRequest = "check-income-request",
  UpdateApplicationStatusToAssessment = "update-application-status-to-assessment-task",
  UpdateNOAStatusToRequired = "update-noa-status-to-required-task",
  UpdateNOAStatusToNotRequired = "update-noa-status-to-not-required-task",
  SaveAssessmentData = "save-assessment-data-task",
  SaveAssessmentDataPartTime = "save-assessment-data-part-time-task",
  SaveDisbursementSchedules = "save-disbursement-task",
  SaveDisbursementSchedulesPartTime = "save-disbursement-part-time-task",
  AssociateMSFAA = "associate-msfaa-task",
}
