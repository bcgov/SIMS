require("../../../env_setup_apps");
import { Module } from "@nestjs/common";
import { QueueRootModule, QueueRegistryModule } from "@sims/queue";
import { StartApplicationAssessmentProcessor } from "./processors";
import { WorkflowClientService, ZeebeModule } from "@sims/services";
import { DatabaseModule } from "@sims/sims-db";

@Module({
  imports: [
    DatabaseModule,
    QueueRootModule,
    QueueRegistryModule,
    ZeebeModule.forRoot(),
  ],
  providers: [StartApplicationAssessmentProcessor, WorkflowClientService],
})
export class QueuesModule {}
