import { Module } from "@nestjs/common";
import { WorkflowController } from "./route-controllers";
import { ConfigModule } from "@sims/utilities/config";
import { DatabaseModule } from "@sims/sims-db";
import { WorkflowDataPreparationService } from "./services";
import { ZeebeModule } from "@sims/services";

@Module({
  imports: [ConfigModule, ZeebeModule.forRoot(), DatabaseModule],
  controllers: [WorkflowController],
  providers: [WorkflowDataPreparationService],
})
export class LoadTestModule {}
