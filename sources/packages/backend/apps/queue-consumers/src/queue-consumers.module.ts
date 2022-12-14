require("../../../env_setup_apps");
import { Global, Module } from "@nestjs/common";
import { QueueModule, QueueService } from "@sims/services/queue";
import {
  IER12IntegrationScheduler,
  StartApplicationAssessmentProcessor,
  CRAResponseIntegrationScheduler,
  CRAProcessIntegrationScheduler,
} from "./processors";
import {
  SequenceControlService,
  WorkflowClientService,
  ZeebeModule,
} from "@sims/services";
import { IER12IntegrationService } from "@sims/integrations/institution-integration/ier12-integration";
import {
  CRAIncomeVerificationsService,
  SshService,
  StudentAssessmentService,
} from "@sims/integrations/services";
import { NotificationsModule } from "@sims/services/notifications";
import { IER12IntegrationModule } from "@sims/integrations/institution-integration/ier12-integration/ier12-integration.module";
import { CRAIntegrationModule } from "@sims/integrations/cra-integration/cra-integration.module";

@Module({
  imports: [
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
    StudentAssessmentService,
    SshService,
    QueueService,
    CRAResponseIntegrationScheduler,
    CRAProcessIntegrationScheduler,
    SequenceControlService,
    CRAIncomeVerificationsService,
    WorkflowClientService,
  ],
  exports: [QueueService],
})
export class QueueConsumersModule {}
