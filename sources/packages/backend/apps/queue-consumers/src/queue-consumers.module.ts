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
import { DatabaseModule } from "@sims/sims-db";
import { IER12IntegrationService } from "@sims/integrations/institution-integration/ier12-integration";
import {
  CRAIncomeVerificationsService,
  SshService,
  StudentAssessmentService,
} from "@sims/integrations/services";
import { NotificationsModule } from "@sims/services/notifications";
import { IER12IntegrationModule } from "@sims/integrations/institution-integration/ier12-integration/ier12-integration.module";
import { CRAPersonalVerificationService } from "@sims/integrations/cra-integration/cra-personal-verification.service";
import { CRAIntegrationService } from "@sims/integrations/cra-integration/cra-integration.service";

@Global()
@Module({
  imports: [
    DatabaseModule,
    QueueModule,
    ZeebeModule.forRoot(),
    IER12IntegrationModule,
    NotificationsModule,
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
    CRAPersonalVerificationService,
    CRAIntegrationService,
    SequenceControlService,
    CRAIncomeVerificationsService,
    WorkflowClientService,
  ],
  exports: [QueueService],
})
export class QueueConsumersModule {}
