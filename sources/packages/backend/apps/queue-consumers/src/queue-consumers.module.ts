require("../../../env_setup_apps");
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
  FullTimeMSFAAProcessIntegrationScheduler,
  PartTimeMSFAAProcessIntegrationScheduler,
  PartTimeECertProcessIntegrationScheduler,
  FullTimeECertProcessIntegrationScheduler,
  FullTimeECertFeedbackIntegrationScheduler,
  PartTimeECertFeedbackIntegrationScheduler,
  FullTimeDisbursementReceiptsFileIntegrationScheduler,
  FINProcessProvincialDailyDisbursementsIntegrationScheduler,
  FederalRestrictionsIntegrationScheduler,
  FullTimeMSFAAProcessResponseIntegrationScheduler,
  PartTimeMSFAAProcessResponseIntegrationScheduler,
  SFASIntegrationScheduler,
  ATBCResponseIntegrationScheduler,
} from "./processors";
import {
  DisbursementScheduleService,
  SequenceControlService,
  StudentRestrictionSharedService,
  WorkflowClientService,
  ZeebeModule,
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
} from "@sims/integrations/esdc-integration";
import { CRAIntegrationModule } from "@sims/integrations/cra-integration/cra-integration.module";
import { StudentAssessmentService } from "./services";
import { SFASIntegrationModule } from "@sims/integrations/sfas-integration";
import { ATBCIntegrationModule } from "@sims/integrations/atbc-integration";

@Module({
  imports: [
    DatabaseModule,
    QueueModule,
    ZeebeModule.forRoot(),
    IER12IntegrationModule,
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
  ],
  providers: [
    StartApplicationAssessmentProcessor,
    CancelApplicationAssessmentProcessor,
    WorkflowClientService,
    IER12IntegrationScheduler,
    ProcessNotificationScheduler,
    SFASIntegrationScheduler,
    ATBCResponseIntegrationScheduler,
    StudentAssessmentService,
    SshService,
    QueueService,
    CRAResponseIntegrationScheduler,
    CRAProcessIntegrationScheduler,
    SequenceControlService,
    WorkflowClientService,
    SINValidationProcessIntegrationScheduler,
    SINValidationRequestIntegrationScheduler,
    FullTimeMSFAAProcessIntegrationScheduler,
    MSFAANumberService,
    PartTimeMSFAAProcessIntegrationScheduler,
    PartTimeECertProcessIntegrationScheduler,
    DisbursementScheduleService,
    StudentRestrictionSharedService,
    FullTimeECertProcessIntegrationScheduler,
    FullTimeECertFeedbackIntegrationScheduler,
    PartTimeECertFeedbackIntegrationScheduler,
    FullTimeDisbursementReceiptsFileIntegrationScheduler,
    FINProcessProvincialDailyDisbursementsIntegrationScheduler,
    FederalRestrictionsIntegrationScheduler,
    FullTimeMSFAAProcessResponseIntegrationScheduler,
    PartTimeMSFAAProcessResponseIntegrationScheduler,
  ],
  exports: [QueueService],
})
export class QueueConsumersModule {}
