import { WorkerListener } from "bullmq";

/**
 *  Queue name from the queue configuration database.
 *  TODO: After bull mq migration, remove the legacy queue names.
 */
export enum QueueNames {
  StartApplicationAssessmentLegacy = "start-application-assessment",
  CancelApplicationAssessmentLegacy = "cancel-application-assessment",
  FileVirusScanProcessorLegacy = "virus-scan",
  IER12IntegrationLegacy = "ier12-integration",
  CRAProcessIntegrationLegacy = "cra-process-integration",
  CRAResponseIntegrationLegacy = "cra-response-integration",
  SINValidationProcessIntegrationLegacy = "sin-validation-process-integration",
  SINValidationResponseIntegrationLegacy = "sin-validation-response-integration",
  PartTimeMSFAAProcessIntegrationLegacy = "part-time-msfaa-process-integration",
  PartTimeECertIntegrationLegacy = "part-time-e-cert-integration",
  PartTimeFeedbackIntegrationLegacy = "part-time-feedback-integration",
  FullTimeMSFAAIntegrationLegacy = "full-time-msfaa-integration",
  FullTimeECertIntegrationLegacy = "full-time-e-cert-integration",
  FullTimeFeedbackIntegrationLegacy = "full-time-feedback-integration",
  FederalRestrictionsIntegrationLegacy = "federal-restrictions-integration",
  DisbursementReceiptsFileIntegrationLegacy = "disbursement-receipts-file-integration",
  ECEProcessIntegrationLegacy = "ece-process-integration",
  ECEProcessResponseIntegrationLegacy = "ece-process-response-integration",
  PartTimeMSFAAProcessResponseIntegrationLegacy = "part-time-msfaa-process-response-integration",
  FullTimeMSFAAProcessResponseIntegrationLegacy = "full-time-msfaa-process-response-integration",
  SFASIntegrationLegacy = "sfas-integration",
  ProcessNotificationsLegacy = "process-notifications",
  ProcessArchiveApplicationsLegacy = "archive-applications",
  AssessmentWorkflowEnqueuerLegacy = "assessment-workflow-enqueuer",
  AssessmentWorkflowQueueRetryLegacy = "assessment-workflow-queue-retry",
  StudentLoanBalancesPartTimeIntegrationLegacy = "student-loan-balances-part-time-integration",
  CASSupplierIntegrationLegacy = "cas-supplier-integration",
  CASInvoicesBatchesCreationLegacy = "cas-invoices-batches-creation",
  CASSendInvoicesLegacy = "cas-send-invoices",
  ApplicationChangesReportIntegrationLegacy = "application-changes-report-integration",
  StudentApplicationNotificationsLegacy = "student-application-notifications",
  SIMSToSFASIntegrationLegacy = "sims-to-sfas-integration",
  ECertCancellationResponseIntegrationLegacy = "e-cert-cancellation-response-integration",
  T4AUploadEnqueuerLegacy = "t4a-upload-enqueuer",
  T4AUploadLegacy = "t4a-upload",
  ReturnedLoansResponseIntegrationLegacy = "returned-loans-response-integration",
  FileVirusScanProcessor = "security.virus-scan",
  ReturnedLoansResponseIntegration = "esdc.returned-loans-response-integration",
  StartApplicationAssessment = "workflow.start-application-assessment",
  CancelApplicationAssessment = "workflow.cancel-application-assessment",
  IER12Integration = "institution.ier12-integration",
  CRAProcessIntegration = "cra.cra-process-integration",
  CRAResponseIntegration = "cra.cra-response-integration",
  SINValidationProcessIntegration = "esdc.sin-validation-process-integration",
  SINValidationResponseIntegration = "esdc.sin-validation-response-integration",
  PartTimeMSFAAProcessIntegration = "esdc.part-time-msfaa-process-integration",
  PartTimeECertIntegration = "esdc.part-time-e-cert-integration",
  PartTimeFeedbackIntegration = "esdc.part-time-feedback-integration",
  FullTimeMSFAAIntegration = "esdc.full-time-msfaa-integration",
  FullTimeECertIntegration = "esdc.full-time-e-cert-integration",
  FullTimeFeedbackIntegration = "esdc.full-time-feedback-integration",
  FederalRestrictionsIntegration = "esdc.federal-restrictions-integration",
  DisbursementReceiptsFileIntegration = "esdc.disbursement-receipts-file-integration",
  ECEProcessIntegration = "institution.ece-process-integration",
  ECEProcessResponseIntegration = "institution.ece-process-response-integration",
  PartTimeMSFAAProcessResponseIntegration = "esdc.part-time-msfaa-process-response-integration",
  FullTimeMSFAAProcessResponseIntegration = "esdc.full-time-msfaa-process-response-integration",
  SFASIntegration = "sfas.sfas-integration",
  ProcessNotifications = "notifications.process-notifications",
  ProcessArchiveApplications = "application.archive-applications",
  AssessmentWorkflowEnqueuer = "workflow.assessment-workflow-enqueuer",
  AssessmentWorkflowQueueRetry = "workflow.assessment-workflow-queue-retry",
  StudentLoanBalancesPartTimeIntegration = "esdc.student-loan-balances-part-time-integration",
  CASSupplierIntegration = "cas.cas-supplier-integration",
  CASInvoicesBatchesCreation = "cas.cas-invoices-batches-creation",
  CASSendInvoices = "cas.cas-send-invoices",
  ApplicationChangesReportIntegration = "esdc.application-changes-report-integration",
  StudentApplicationNotifications = "notifications.student-application-notifications",
  SIMSToSFASIntegration = "sfas.sims-to-sfas-integration",
  ECertCancellationResponseIntegration = "esdc.e-cert-cancellation-response-integration",
  T4AUploadEnqueuer = "t4a.t4a-upload-enqueuer",
  T4AUpload = "t4a.t4a-upload",
}

/**
 * Suffix used for naming queue jobs.
 */
export const JOB_SUFFIX = "-job";

/**
 * Job names for the queues.
 */
export const QueueJobNames = {
  StartApplicationAssessmentJob: `${QueueNames.StartApplicationAssessment}${JOB_SUFFIX}`,
  CancelApplicationAssessmentJob: `${QueueNames.CancelApplicationAssessment}${JOB_SUFFIX}`,
  T4AUploadJob: `${QueueNames.T4AUpload}${JOB_SUFFIX}`,
  FileVirusScanProcessorJob: `${QueueNames.FileVirusScanProcessor}${JOB_SUFFIX}`,
} as const;

/**
 * BullMQ queue worker events.
 */
export type QueueWorkerEvents = keyof WorkerListener;

export const QUEUE_WORKER_EVENTS: QueueWorkerEvents[] = [
  "error",
  "active",
  "stalled",
  "completed",
  "progress",
  "failed",
  "closed",
  "paused",
  "resumed",
  "drained",
  "lockRenewalFailed",
  "locksRenewed",
];

// TODO: After bull mq migration, remove this constant.
export const BULL_MQ_MIGRATED_QUEUE_NAMES: string[] = [
  QueueNames.FileVirusScanProcessor,
  QueueNames.ReturnedLoansResponseIntegration,
  QueueNames.StartApplicationAssessment,
  QueueNames.CancelApplicationAssessment,
  QueueNames.IER12Integration,
  QueueNames.CRAProcessIntegration,
  QueueNames.CRAResponseIntegration,
  QueueNames.SINValidationProcessIntegration,
  QueueNames.SINValidationResponseIntegration,
  QueueNames.PartTimeMSFAAProcessIntegration,
  QueueNames.PartTimeECertIntegration,
  QueueNames.PartTimeFeedbackIntegration,
  QueueNames.FullTimeMSFAAIntegration,
  QueueNames.FullTimeECertIntegration,
  QueueNames.FullTimeFeedbackIntegration,
  QueueNames.FederalRestrictionsIntegration,
  QueueNames.DisbursementReceiptsFileIntegration,
  QueueNames.ECEProcessIntegration,
  QueueNames.ECEProcessResponseIntegration,
  QueueNames.PartTimeMSFAAProcessResponseIntegration,
  QueueNames.FullTimeMSFAAProcessResponseIntegration,
  QueueNames.SFASIntegration,
  QueueNames.ProcessNotifications,
  QueueNames.ProcessArchiveApplications,
  QueueNames.AssessmentWorkflowEnqueuer,
  QueueNames.AssessmentWorkflowQueueRetry,
  QueueNames.StudentLoanBalancesPartTimeIntegration,
  QueueNames.CASSupplierIntegration,
  QueueNames.CASInvoicesBatchesCreation,
  QueueNames.CASSendInvoices,
  QueueNames.ApplicationChangesReportIntegration,
  QueueNames.StudentApplicationNotifications,
  QueueNames.SIMSToSFASIntegration,
  QueueNames.ECertCancellationResponseIntegration,
  QueueNames.T4AUploadEnqueuer,
  QueueNames.T4AUpload,
];
