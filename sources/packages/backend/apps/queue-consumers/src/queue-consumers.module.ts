require("../../../env_setup_apps");
import { Module } from "@nestjs/common";
import { QueueModule, QueueService } from "@sims/services/queue";
import {
  CancelApplicationAssessmentProcessor,
  StartApplicationAssessmentProcessor,
  ProcessNotificationScheduler,
  IER12IntegrationScheduler,
  CRAResponseIntegrationScheduler,
  CRAProcessIntegrationScheduler,
  StartApplicationAssessmentProcessor,
  ProcessNotificationScheduler,
} from "./processors";
import {
  DisbursementScheduleService,
  WorkflowClientService,
  SequenceControlService,
  ZeebeModule,
} from "@sims/services";
import { DatabaseModule } from "@sims/sims-db";
import { IER12IntegrationService } from "@sims/integrations/institution-integration/ier12-integration";
import { SshService } from "@sims/integrations/services";
import { NotificationsModule } from "@sims/services/notifications";
import { IER12IntegrationModule } from "@sims/integrations/institution-integration/ier12-integration/ier12-integration.module";
import { StudentAssessmentService } from "./services";
import { SystemUserModule } from "@sims/services/system-users";
import { CRAIntegrationModule } from "@sims/integrations/cra-integration/cra-integration.module";

@Module({
  imports: [
    DatabaseModule,
    QueueModule,
    ZeebeModule.forRoot(),
    IER12IntegrationModule,
    NotificationsModule,
    SystemUserModule,
    CRAIntegrationModule,
  ],
  providers: [
    StartApplicationAssessmentProcessor,
    CancelApplicationAssessmentProcessor,
    WorkflowClientService,
    IER12IntegrationScheduler,
    IER12IntegrationService,
    ProcessNotificationScheduler,
    StudentAssessmentService,
    SshService,
    QueueService,
    DisbursementScheduleService,
    CRAResponseIntegrationScheduler,
    CRAProcessIntegrationScheduler,
    SequenceControlService,
    WorkflowClientService,
  ],
  exports: [QueueService],
})
export class QueueConsumersModule {}
