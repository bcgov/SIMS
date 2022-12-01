require("../../../env_setup_apps");
import { Module } from "@nestjs/common";
import { QueueModule } from "@sims/services/queue";
import { StartApplicationAssessmentProcessor } from "./processors";
import { WorkflowClientService, ZeebeModule } from "@sims/services";
import { DatabaseModule } from "@sims/sims-db";
import { IER12IntegrationService } from "@sims/integrations/institution-integration/ier-integration";
import {
  SshService,
  StudentAssessmentService,
} from "@sims/integrations/services";
import { IER12IntegrationModule } from "@sims/integrations/institution-integration/ier-integration/ier12-integration.module";
import { IERIntegrationScheduler } from "./processors/schedulers/ier-Integrations/ier-integration.scheduler";

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
    IERIntegrationScheduler,
    IER12IntegrationService,
    StudentAssessmentService,
    SshService,
  ],
})
export class QueueConsumersModule {}
