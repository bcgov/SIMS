require("../../../env_setup_apps");
import { Module } from "@nestjs/common";
import { QueueModule, QueueService } from "@sims/services/queue";
import { StartApplicationAssessmentProcessor } from "./processors";
import {
  SequenceControlService,
  WorkflowClientService,
  ZeebeModule,
} from "@sims/services";
import { DatabaseModule, DBEntities } from "@sims/sims-db";
import { IER12IntegrationService } from "@sims/integrations/institution-integration/ier12-integration";
import {
  CRAIncomeVerificationsService,
  SshService,
  StudentAssessmentService,
} from "@sims/integrations/services";
import { NotificationsModule } from "@sims/services/notifications";
import { IER12IntegrationModule } from "@sims/integrations/institution-integration/ier12-integration/ier12-integration.module";
import { IER12IntegrationScheduler } from "./processors/schedulers/institution-integration/ier12-integration/ier12-integration.scheduler";
import { TypeOrmModule } from "@nestjs/typeorm";
import CRAResponseIntegrationScheduler from "./processors/schedulers/cra-integration/cra-response-integration.scheduler";
import CRAProcessIntegrationScheduler from "./processors/schedulers/cra-integration/cra-process-integration.scheduler";
import { CRAPersonalVerificationService } from "@sims/integrations/cra-integration/cra-personal-verification.service";
import { CRAIntegrationService } from "@sims/integrations/cra-integration/cra-integration.service";

@Module({
  imports: [
    DatabaseModule,
    QueueModule,
    ZeebeModule.forRoot(),
    IER12IntegrationModule,
    TypeOrmModule.forFeature(DBEntities),
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
})
export class QueueConsumersModule {}
