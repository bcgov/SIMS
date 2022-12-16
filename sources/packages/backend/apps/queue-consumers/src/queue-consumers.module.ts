require("../../../env_setup_apps");
import { Module } from "@nestjs/common";
import { QueueModule, QueueService } from "@sims/services/queue";
import {
  IER12IntegrationScheduler,
  CRAResponseIntegrationScheduler,
  CRAProcessIntegrationScheduler,
  StartApplicationAssessmentProcessor,
  ProcessNotificationScheduler,
  ATBCIntegrationProcessor,
  SFASIntegrationScheduler,
} from "./processors";
import { DatabaseModule } from "@sims/sims-db";
import {
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
import { SFASIntegrationModule } from "@sims/integrations/sfas-integration";
import { ATBCIntegrationModule } from "@sims/integrations/atbc-integration";

@Module({
  imports: [
    DatabaseModule,
    QueueModule,
    ZeebeModule.forRoot(),
    IER12IntegrationModule,
    NotificationsModule,
    CRAIntegrationModule,
    SFASIntegrationModule,
    ATBCIntegrationModule,
  ],
  providers: [
    StartApplicationAssessmentProcessor,
    WorkflowClientService,
    IER12IntegrationScheduler,
    IER12IntegrationService,
    ProcessNotificationScheduler,
    ATBCIntegrationProcessor,
    SFASIntegrationScheduler,
    StudentAssessmentService,
    SshService,
    QueueService,
    CRAResponseIntegrationScheduler,
    CRAProcessIntegrationScheduler,
    SequenceControlService,
    WorkflowClientService,
  ],
  exports: [QueueService],
})
export class QueueConsumersModule {}
