require("../../../env_setup_apps");
import { Module } from "@nestjs/common";
import { QueueModule, QueueService } from "@sims/services/queue";
import {
  StartApplicationAssessmentProcessor,
  ProcessNotificationScheduler,
  ATBCIntegrationProcessor,
} from "./processors";
import { WorkflowClientService, ZeebeModule } from "@sims/services";
import { DatabaseModule, DBEntities } from "@sims/sims-db";
import { IER12IntegrationService } from "@sims/integrations/institution-integration/ier12-integration";
import {
  SshService,
  StudentAssessmentService,
} from "@sims/integrations/services";
import { NotificationsModule } from "@sims/services/notifications";
import { IER12IntegrationModule } from "@sims/integrations/institution-integration/ier12-integration/ier12-integration.module";
import { IER12IntegrationScheduler } from "./processors/schedulers/institution-integration/ier12-integration/ier12-integration.scheduler";
import { TypeOrmModule } from "@nestjs/typeorm";

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
    ProcessNotificationScheduler,
    ATBCIntegrationProcessor,
    StudentAssessmentService,
    SshService,
    QueueService,
  ],
})
export class QueueConsumersModule {}
