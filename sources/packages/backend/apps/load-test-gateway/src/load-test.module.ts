import { Module } from "@nestjs/common";
import { WorkflowController } from "./route-controllers";
import { ConfigModule } from "@sims/utilities/config";
import { DatabaseModule } from "@sims/sims-db";

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [WorkflowController],
})
export class LoadTestModule {}
