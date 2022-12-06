/**
 *  Queue name from the queue configuration database.
 */
export enum QueueNames {
  StartApplicationAssessment = "start-application-assessment",
  IER12Integration = "ier12-integration",
  CRAProcessIntegration = "cra-process-integration",
  CRAResponseIntegration = "cra-response-integration",
  SINValidationProcessIntegration = "sin-validation-process-integration",
  SINValidationRequestIntegration = "sin-validation-request-integration",
  PtMSFAAProcessIntegration = "pt-msfaa-process-integration",
  PTECertIntegration = "pt-e-cert-integration",
  PTFeedbackIntegration = "pt-feedback-integration",
  FTMSFAAIntegration = "ft-msfaa-integration",
  FTECertIntegration = "ft-e-cert-integration",
  FTFeedbackIntegration = "ft-feedback-integration",
  FerdralRestrictionsIntegration = "federal-restrictions-integration",
  FTDisbursementReceiptsFileIntegration = "ft-disbursement-receipts-file-integration",
  ECEProcessIntegration = "ece-process-integration",
  ECEProcessResponseIntegration = "ece-process-response-integration",
  FINProcessProvincialDailyDisbursementsIntegration = "fin-process-provincial-daily-disbursements-integration",
  PTMSFAAProcessResponseIntegration = "pt-msfaa-process-response-integration",
  FTMSFAAProcessResponseIntegration = "ft-msfaa-process-response-integration",
  SFASSIntegration = "sfass-integration",
  ATBCIntegration = "atbc-integration",
  ATBCResponseIntegration = "atbc-response-integration",
  SendEmailNotification = "send-email-notification",
}
