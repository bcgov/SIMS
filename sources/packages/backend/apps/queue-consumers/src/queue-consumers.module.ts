require("../../../env_setup_apps");
import { Module } from "@nestjs/common";
import { QueueModule } from "@sims/services/queue";
import { StartApplicationAssessmentProcessor } from "./processors";
import { WorkflowClientService, ZeebeModule } from "@sims/services";
import { DatabaseModule } from "@sims/sims-db";

@Module({
  imports: [DatabaseModule, QueueModule, ZeebeModule.forRoot()],
  providers: [StartApplicationAssessmentProcessor, WorkflowClientService],
})
export class QueueConsumersModule {}
