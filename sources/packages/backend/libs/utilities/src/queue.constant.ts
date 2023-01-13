/**
 *  Queue name from the queue configuration database.
 */
export enum QueueNames {
  StartApplicationAssessment = "start-application-assessment",
  CancelApplicationAssessment = "cancel-application-assessment",
  IER12Integration = "ier12-integration",
  CRAProcessIntegration = "cra-process-integration",
  CRAResponseIntegration = "cra-response-integration",
  SINValidationProcessIntegration = "sin-validation-process-integration",
  SINValidationRequestIntegration = "sin-validation-request-integration",
  PartTimeMSFAAProcessIntegration = "part-time-msfaa-process-integration",
  PartTimeECertIntegration = "part-time-e-cert-integration",
  PartTimeFeedbackIntegration = "part-time-feedback-integration",
  FullTimeMSFAAIntegration = "full-time-msfaa-integration",
  FullTimeECertIntegration = "full-time-e-cert-integration",
  FullTimeFeedbackIntegration = "full-time-feedback-integration",
  FederalRestrictionsIntegration = "federal-restrictions-integration",
  FullTimeDisbursementReceiptsFileIntegration = "full-time-disbursement-receipts-file-integration",
  ECEProcessIntegration = "ece-process-integration",
  ECEProcessResponseIntegration = "ece-process-response-integration",
  FINProcessProvincialDailyDisbursementsIntegration = "fin-process-provincial-daily-disbursements-integration",
  PartTimeMSFAAProcessResponseIntegration = "part-time-msfaa-process-response-integration",
  FullTimeMSFAAProcessResponseIntegration = "full-time-msfaa-process-response-integration",
  SFASIntegration = "sfas-integration",
  ATBCResponseIntegration = "atbc-response-integration",
  ProcessNotifications = "process-notifications",
  ProcessArchiveApplications = "process-archive-applications",
}
