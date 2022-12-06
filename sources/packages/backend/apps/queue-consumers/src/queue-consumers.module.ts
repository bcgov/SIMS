require("../../../env_setup_apps");
import { Module } from "@nestjs/common";
import { QueueModule } from "@sims/services/queue";
import { StartApplicationAssessmentProcessor } from "./processors";
import { WorkflowClientService, ZeebeModule } from "@sims/services";
import { DatabaseModule } from "@sims/sims-db";
import { IER12IntegrationService } from "@sims/integrations/institution-integration/ier12-integration";
import {
  SshService,
  StudentAssessmentService,
} from "@sims/integrations/services";
import {
  NotificationService,
  GCNotifyService,
} from "@sims/services/notifications";
import { IER12IntegrationModule } from "@sims/integrations/institution-integration/ier12-integration/ier12-integration.module";
import { IER12IntegrationScheduler } from "./processors/schedulers/institution-integration/ier12-integration/ier12-integration.scheduler";

@Module({
  imports: [
    DatabaseModule,
    QueueModule,
    ZeebeModule.forRoot(),
    IER12IntegrationModule,
  ],
  providers: [
    StartApplicationAssessmentProcessor,
    WorkflowClientService,
    NotificationService,
    GCNotifyService,
    IER12IntegrationScheduler,
    IER12IntegrationService,
    StudentAssessmentService,
    SshService,
  ],
})
export class QueueConsumersModule {}
