require("../../../env_setup_apps");
import { Module } from "@nestjs/common";
import { QueueModule, QueueService } from "@sims/services/queue";
import {
  IER12IntegrationScheduler,
  CRAResponseIntegrationScheduler,
  CRAProcessIntegrationScheduler,
  StartApplicationAssessmentProcessor,
  ProcessNotificationScheduler,
} from "./processors";
import { DatabaseModule } from "@sims/sims-db";
import {
  DisbursementSchedulerService,
  SequenceControlService,
  WorkflowClientService,
  ZeebeModule,
} from "@sims/services";
import { IER12IntegrationService } from "@sims/integrations/institution-integration/ier12-integration";
import {
  SshService,
  StudentAssessmentService,
} from "@sims/integrations/services";
import { NotificationsModule } from "@sims/services/notifications";
import { IER12IntegrationModule } from "@sims/integrations/institution-integration/ier12-integration/ier12-integration.module";
import { CRAIntegrationModule } from "@sims/integrations/cra-integration/cra-integration.module";
import { SINValidationProcessIntegrationScheduler } from "./processors/schedulers/esdc-integration/sin-validation-integration/sin-validation-process-integration.scheduler";
import { SINValidationProcessingService } from "@sims/integrations/esdc-integration/sin-validation/sin-validation-processing.service";
import { SystemUsersService } from "@sims/services/system-users";
import { SINValidationService } from "@sims/services/sin-validation/sin-validation.service";
import { StudentService } from "@sims/services/student/student.service";
import { SINValidationIntegrationService } from "@sims/integrations/esdc-integration/sin-validation/sin-validation-integration.service";
import { SINValidationRequestIntegrationScheduler } from "./processors/schedulers/esdc-integration/sin-validation-integration/sin-validation-process-response-integration.scheduler";
import { FullTimeMSFAAProcessIntegrationScheduler } from "./processors/schedulers/esdc-integration/msfaa-integration/msfaa-full-time-process-integration.scheduler";
import { MSFAARequestService } from "@sims/integrations/esdc-integration/msfaa-integration/msfaa-request.service";
import { MSFAANumberService } from "@sims/integrations/services/msfaa-number/msfaa-number.service";
import { MSFAAIntegrationService } from "@sims/integrations/esdc-integration/msfaa-integration/msfaa-integration.service";
import { PartTimeMSFAAProcessIntegrationScheduler } from "./processors/schedulers/esdc-integration/msfaa-integration/msfaa-part-time-process-integration.scheduler";
import { PartTimeECertProcessIntegrationScheduler } from "./processors/schedulers/esdc-integration/ecert-integration/ecert-part-time-process-integration.scheduler";
import { ECertFileHandler } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-file-handler";
import { DisbursementSchedulerService as DisbursementSchedulersService } from "@sims/integrations/services/disbursement-schedule-service/disbursement-schedule-service";
import { DisbursementScheduleErrorsService } from "@sims/integrations/services/disbursement-schedule-errors/disbursement-schedule-errors.service";
import { ECertFullTimeIntegrationService } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-full-time-integration/e-cert-full-time-integration.service";
import { ECertPartTimeIntegrationService } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-part-time-integration/e-cert-part-time-integration.service";
import { StudentRestrictionService } from "@sims/integrations/services/restriction/student-restriction.service";
import { ECertFullTimeFileHeader } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-full-time-integration/e-cert-files/e-cert-file-header";
import { ECertFullTimeFileFooter } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-full-time-integration/e-cert-files/e-cert-file-footer";
import { ECertPartTimeFileHeader } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-part-time-integration/e-cert-files/e-cert-file-header";
import { ECertPartTimeFileFooter } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-part-time-integration/e-cert-files/e-cert-file-footer";
import { FullTimeECertProcessIntegrationScheduler } from "./processors/schedulers/esdc-integration/ecert-integration/ecert-full-time-process-integration.scheduler";
import { FullTimeECertFeedbackIntegrationScheduler } from "./processors/schedulers/esdc-integration/ecert-integration/ecert-full-time-feedback-integration.scheduler";
import { PartTimeECertFeedbackIntegrationScheduler } from "./processors/schedulers/esdc-integration/ecert-integration/ecert-part-time-feedback-integration.scheduler";
import { FullTimeDisbursementReceiptsFileIntegrationScheduler } from "./processors/schedulers/esdc-integration/ecert-integration/full-time-disbursement-receipts-integration.scheduler";
import { DisbursementReceiptProcessingService } from "@sims/integrations/esdc-integration/disbursement-receipt-integration/disbursement-receipt-processing.service";
import { DisbursementReceiptIntegrationService } from "@sims/integrations/esdc-integration/disbursement-receipt-integration/disbursement-receipt-integration.service";
import { DisbursementReceiptService } from "@sims/integrations/services/disbursement-receipt/disbursement-receipt.service";
import { FINProcessProvincialDailyDisbursementsIntegrationScheduler } from "./processors/schedulers/esdc-integration/ecert-integration/provincial-daily-disbursements-integration.scheduler";
import { DisbursementReceiptRequestService } from "@sims/integrations/esdc-integration/disbursement-receipt-integration/disbursement-receipt-request.service";
import { ReportService } from "@sims/integrations/services/report/report.service";
import { FederalRestrictionsIntegrationScheduler } from "./processors/schedulers/esdc-integration/federal-restrictions-integration/federal-restrictions-integration.scheduler";
import { FedRestrictionProcessingService } from "@sims/integrations/esdc-integration/fed-restriction-integration/fed-restriction-processing.service";
import { RestrictionService } from "@sims/integrations/services/restriction/restriction.service";
import { FederalRestrictionService } from "@sims/integrations/services/restriction/federal-restriction.service";
import { FedRestrictionIntegrationService } from "@sims/integrations/esdc-integration/fed-restriction-integration/fed-restriction-integration.service";

@Module({
  imports: [
    DatabaseModule,
    QueueModule,
    ZeebeModule.forRoot(),
    IER12IntegrationModule,
    NotificationsModule,
    CRAIntegrationModule,
  ],
  providers: [
    StartApplicationAssessmentProcessor,
    WorkflowClientService,
    IER12IntegrationScheduler,
    IER12IntegrationService,
    ProcessNotificationScheduler,
    StudentAssessmentService,
    SshService,
    QueueService,
    CRAResponseIntegrationScheduler,
    CRAProcessIntegrationScheduler,
    SequenceControlService,
    WorkflowClientService,
    SINValidationProcessIntegrationScheduler,
    SINValidationProcessingService,
    SystemUsersService,
    SINValidationService,
    StudentService,
    SINValidationIntegrationService,
    SINValidationRequestIntegrationScheduler,
    FullTimeMSFAAProcessIntegrationScheduler,
    MSFAARequestService,
    MSFAANumberService,
    MSFAAIntegrationService,
    PartTimeMSFAAProcessIntegrationScheduler,
    PartTimeECertProcessIntegrationScheduler,
    ECertFileHandler,
    DisbursementSchedulerService,
    DisbursementSchedulersService,
    DisbursementScheduleErrorsService,
    ECertFullTimeIntegrationService,
    ECertPartTimeIntegrationService,
    StudentRestrictionService,
    ECertFullTimeFileHeader,
    ECertFullTimeFileFooter,
    ECertPartTimeFileHeader,
    ECertPartTimeFileFooter,
    FullTimeECertProcessIntegrationScheduler,
    FullTimeECertFeedbackIntegrationScheduler,
    PartTimeECertFeedbackIntegrationScheduler,
    FullTimeDisbursementReceiptsFileIntegrationScheduler,
    DisbursementReceiptProcessingService,
    DisbursementReceiptIntegrationService,
    DisbursementReceiptService,
    FINProcessProvincialDailyDisbursementsIntegrationScheduler,
    DisbursementReceiptRequestService,
    ReportService,
    FederalRestrictionsIntegrationScheduler,
    FedRestrictionProcessingService,
    RestrictionService,
    FederalRestrictionService,
    FedRestrictionIntegrationService,
  ],
  exports: [QueueService],
})
export class QueueConsumersModule {}
