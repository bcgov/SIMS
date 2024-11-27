import { Module } from "@nestjs/common";
import { QueueModule, QueueService } from "@sims/services/queue";
import {
  StartApplicationAssessmentProcessor,
  CancelApplicationAssessmentProcessor,
  ProcessNotificationScheduler,
  IER12IntegrationScheduler,
  CRAResponseIntegrationScheduler,
  CRAProcessIntegrationScheduler,
  SINValidationProcessIntegrationScheduler,
  SINValidationResponseIntegrationScheduler,
  StudentLoanBalancesPartTimeIntegrationScheduler,
  FullTimeMSFAAProcessIntegrationScheduler,
  PartTimeMSFAAProcessIntegrationScheduler,
  PartTimeECertProcessIntegrationScheduler,
  FullTimeECertProcessIntegrationScheduler,
  FullTimeECertFeedbackIntegrationScheduler,
  PartTimeECertFeedbackIntegrationScheduler,
  DisbursementReceiptsFileIntegrationScheduler,
  FederalRestrictionsIntegrationScheduler,
  FullTimeMSFAAProcessResponseIntegrationScheduler,
  PartTimeMSFAAProcessResponseIntegrationScheduler,
  SFASIntegrationScheduler,
  ProcessArchiveApplicationsScheduler,
  ECEProcessIntegrationScheduler,
  ECEResponseIntegrationScheduler,
  AssessmentWorkflowEnqueuerScheduler,
  WorkflowQueueRetryScheduler,
  CASSupplierIntegrationScheduler,
  ApplicationChangesReportIntegrationScheduler,
  StudentApplicationNotificationsScheduler,
  SIMSToSFASIntegrationScheduler,
} from "./processors";
import {
  DisbursementScheduleSharedService,
  RestrictionSharedService,
  SequenceControlService,
  StudentRestrictionSharedService,
  WorkflowClientService,
  ZeebeModule,
  ConfirmationOfEnrollmentService,
  MSFAANumberSharedService,
  GlobalHttpModule,
  AssessmentSequentialProcessingService,
  ClamAVService,
} from "@sims/services";
import { DatabaseModule } from "@sims/sims-db";
import { IER12IntegrationModule } from "@sims/integrations/institution-integration/ier12-integration";
import { NotificationsModule } from "@sims/services/notifications";
import { SystemUserModule } from "@sims/services/system-users";
import { MSFAANumberService, SshService } from "@sims/integrations/services";
import {
  ApplicationChangesReportIntegrationModule,
  DisbursementReceiptIntegrationModule,
  ECertIntegrationModule,
  FedRestrictionIntegrationModule,
  MSFAAIntegrationModule,
  SINValidationModule,
  StudentLoanBalancesIntegrationModule,
} from "@sims/integrations/esdc-integration";
import { CRAIntegrationModule } from "@sims/integrations/cra-integration/cra-integration.module";
import {
  StudentAssessmentService,
  ApplicationService,
  WorkflowEnqueuerService,
  StudentFileService,
  CASActiveSupplierNotFoundProcessor,
  CASPreValidationsProcessor,
  CASActiveSupplierFoundProcessor,
  CASActiveSupplierAndSiteFoundProcessor,
  MetricsService,
} from "./services";
import { SFASIntegrationModule } from "@sims/integrations/sfas-integration";
import { ATBCIntegrationModule } from "@sims/integrations/atbc-integration";
import { ECEIntegrationModule } from "@sims/integrations/institution-integration/ece-integration";
import { HealthController, MetricsController } from "./controllers";
import { MicroserviceHealthIndicator, TerminusModule } from "@nestjs/terminus";
import { CASSupplierIntegrationService } from "./services/cas-supplier/cas-supplier.service";
import { VirusScanProcessor } from "./processors/virus-scan/virus-scan.processor";
import { CASService } from "@sims/integrations/cas/cas.service";
import { ObjectStorageService } from "@sims/integrations/object-storage";
import { BullBoardQueuesModule } from "./bull-board/bull-board-queues.module";
import { QueuesMetricsModule } from "./queues-bootstrap.module";

// TODO: Removed ATBCResponseIntegrationScheduler in providers, the queuename from enum and the decorators of the processor as part of #2539.
@Module({
  imports: [
    GlobalHttpModule,
    DatabaseModule,
    QueueModule,
    BullBoardQueuesModule,
    QueuesMetricsModule,
    ZeebeModule.forRoot(),
    IER12IntegrationModule,
    ECEIntegrationModule,
    NotificationsModule,
    SystemUserModule,
    CRAIntegrationModule,
    SFASIntegrationModule,
    ATBCIntegrationModule,
    DisbursementReceiptIntegrationModule,
    ECertIntegrationModule,
    FedRestrictionIntegrationModule,
    MSFAAIntegrationModule,
    SINValidationModule,
    StudentLoanBalancesIntegrationModule,
    TerminusModule,
    ApplicationChangesReportIntegrationModule,
  ],
  providers: [
    VirusScanProcessor,
    StartApplicationAssessmentProcessor,
    CancelApplicationAssessmentProcessor,
    WorkflowClientService,
    IER12IntegrationScheduler,
    ECEProcessIntegrationScheduler,
    ProcessNotificationScheduler,
    SFASIntegrationScheduler,
    StudentAssessmentService,
    StudentFileService,
    ClamAVService,
    ObjectStorageService,
    SshService,
    QueueService,
    CRAResponseIntegrationScheduler,
    CRAProcessIntegrationScheduler,
    SequenceControlService,
    WorkflowClientService,
    SINValidationProcessIntegrationScheduler,
    SINValidationResponseIntegrationScheduler,
    StudentLoanBalancesPartTimeIntegrationScheduler,
    FullTimeMSFAAProcessIntegrationScheduler,
    MSFAANumberService,
    PartTimeMSFAAProcessIntegrationScheduler,
    PartTimeECertProcessIntegrationScheduler,
    DisbursementScheduleSharedService,
    StudentRestrictionSharedService,
    RestrictionSharedService,
    FullTimeECertProcessIntegrationScheduler,
    FullTimeECertFeedbackIntegrationScheduler,
    PartTimeECertFeedbackIntegrationScheduler,
    DisbursementReceiptsFileIntegrationScheduler,
    FederalRestrictionsIntegrationScheduler,
    FullTimeMSFAAProcessResponseIntegrationScheduler,
    PartTimeMSFAAProcessResponseIntegrationScheduler,
    ProcessArchiveApplicationsScheduler,
    ECEResponseIntegrationScheduler,
    ApplicationService,
    ConfirmationOfEnrollmentService,
    MSFAANumberSharedService,
    AssessmentWorkflowEnqueuerScheduler,
    WorkflowEnqueuerService,
    WorkflowQueueRetryScheduler,
    MicroserviceHealthIndicator,
    AssessmentSequentialProcessingService,
    CASSupplierIntegrationScheduler,
    CASSupplierIntegrationService,
    CASService,
    ApplicationChangesReportIntegrationScheduler,
    StudentApplicationNotificationsScheduler,
    SIMSToSFASIntegrationScheduler,
    CASActiveSupplierNotFoundProcessor,
    CASPreValidationsProcessor,
    CASActiveSupplierFoundProcessor,
    CASActiveSupplierAndSiteFoundProcessor,
    MetricsService,
  ],
  controllers: [HealthController, MetricsController],
})
export class QueueConsumersModule {}
