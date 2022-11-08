require("../../../env_setup_apps");
import { Module } from "@nestjs/common";
import { QueueRootModule } from "@sims/queue";
import { QueueRegistryModule } from "@sims/queue";
import { StartApplicationAssessmentProcessor } from "./processors";
import { WorkflowClientService, ZeebeModule } from "@sims/services";

@Module({
  imports: [QueueRootModule, QueueRegistryModule, ZeebeModule.forRoot()],
  providers: [StartApplicationAssessmentProcessor, WorkflowClientService],
})
export class QueuesModule {}
