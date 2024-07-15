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
  SINValidationRequestIntegrationScheduler,
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
  CASService,
  StudentFileService,
} from "./services";
import { SFASIntegrationModule } from "@sims/integrations/sfas-integration";
import { ATBCIntegrationModule } from "@sims/integrations/atbc-integration";
import { ECEIntegrationModule } from "@sims/integrations/institution-integration/ece-integration";
import { HealthController } from "./controllers";
import { MicroserviceHealthIndicator, TerminusModule } from "@nestjs/terminus";
import { CASSupplierIntegrationService } from "./services/cas-supplier/cas-supplier.service";
import { VirusScanProcessor } from "./processors/virus-scan/virus-scan.processor";

// TODO: Removed ATBCResponseIntegrationScheduler in providers, the queuename from enum and the decorators of the processor as part of #2539.
@Module({
  imports: [
    GlobalHttpModule,
    DatabaseModule,
    QueueModule,
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
    SshService,
    QueueService,
    CRAResponseIntegrationScheduler,
    CRAProcessIntegrationScheduler,
    SequenceControlService,
    WorkflowClientService,
    SINValidationProcessIntegrationScheduler,
    SINValidationRequestIntegrationScheduler,
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
  ],
  controllers: [HealthController],
})
export class QueueConsumersModule {}
