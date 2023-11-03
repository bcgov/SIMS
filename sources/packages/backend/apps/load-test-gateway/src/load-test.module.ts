import { Module } from "@nestjs/common";
import { WorkflowController } from "./route-controllers";
import { ConfigModule } from "@sims/utilities/config";
import { DatabaseModule } from "@sims/sims-db";
import { WorkflowDataLoadService } from "./services";
import { ZeebeModule } from "@sims/services";

@Module({
  imports: [ConfigModule, ZeebeModule.forRoot(), DatabaseModule],
  controllers: [WorkflowController],
  providers: [WorkflowDataLoadService],
})
export class LoadTestModule {}
