/**
 *  Queue name from the queue configuration database.
 *  TODO: After bull mq migration, remove the legacy queue names.
 */
export enum QueueNames {
  StartApplicationAssessment = "start-application-assessment",
  CancelApplicationAssessment = "cancel-application-assessment",
  FileVirusScanProcessorLegacy = "virus-scan",
  IER12Integration = "ier12-integration",
  CRAProcessIntegration = "cra-process-integration",
  CRAResponseIntegration = "cra-response-integration",
  SINValidationProcessIntegration = "sin-validation-process-integration",
  SINValidationResponseIntegration = "sin-validation-response-integration",
  PartTimeMSFAAProcessIntegration = "part-time-msfaa-process-integration",
  PartTimeECertIntegration = "part-time-e-cert-integration",
  PartTimeFeedbackIntegration = "part-time-feedback-integration",
  FullTimeMSFAAIntegration = "full-time-msfaa-integration",
  FullTimeECertIntegration = "full-time-e-cert-integration",
  FullTimeFeedbackIntegration = "full-time-feedback-integration",
  FederalRestrictionsIntegration = "federal-restrictions-integration",
  DisbursementReceiptsFileIntegration = "disbursement-receipts-file-integration",
  ECEProcessIntegration = "ece-process-integration",
  ECEProcessResponseIntegration = "ece-process-response-integration",
  PartTimeMSFAAProcessResponseIntegration = "part-time-msfaa-process-response-integration",
  FullTimeMSFAAProcessResponseIntegration = "full-time-msfaa-process-response-integration",
  SFASIntegration = "sfas-integration",
  ProcessNotifications = "process-notifications",
  ProcessArchiveApplications = "archive-applications",
  AssessmentWorkflowEnqueuer = "assessment-workflow-enqueuer",
  AssessmentWorkflowQueueRetry = "assessment-workflow-queue-retry",
  StudentLoanBalancesPartTimeIntegration = "student-loan-balances-part-time-integration",
  CASSupplierIntegration = "cas-supplier-integration",
  CASInvoicesBatchesCreation = "cas-invoices-batches-creation",
  CASSendInvoices = "cas-send-invoices",
  ApplicationChangesReportIntegration = "application-changes-report-integration",
  StudentApplicationNotifications = "student-application-notifications",
  SIMSToSFASIntegration = "sims-to-sfas-integration",
  ECertCancellationResponseIntegration = "e-cert-cancellation-response-integration",
  T4AUploadEnqueuer = "t4a-upload-enqueuer",
  T4AUpload = "t4a-upload",
  ReturnedLoansResponseIntegrationLegacy = "returned-loans-response-integration",
  FileVirusScanProcessor = "virus-scan-v2",
  ReturnedLoansResponseIntegration = "returned-loans-response-integration-v2",
}

/**
 * Suffix used for naming queue jobs.
 */
export const JOB_SUFFIX = "-job";

/**
 * Job names for the queues.
 */
export enum QueueJobNames {
  FileVirusScanProcessor = `${QueueNames.FileVirusScanProcessor}${JOB_SUFFIX}`,
}

// TODO: After bull mq migration, remove this constant.
export const BULL_MQ_MIGRATED_QUEUE_NAMES: string[] = [
  QueueNames.FileVirusScanProcessor,
  QueueNames.ReturnedLoansResponseIntegration,
];
