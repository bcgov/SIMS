import { Module } from "@nestjs/common";
import { WorkflowController } from "./route-controllers";
import { ConfigModule } from "@sims/utilities/config";
import { DatabaseModule } from "@sims/sims-db";
import { WorkflowDataLoadService } from "./services";
import { ZeebeModule } from "@sims/services";
import { LoadTestAuthModule } from "./auth/load-test-auth.module";
import { LoadTestHttpModule } from "./load-test-http/load-test-http.module";

@Module({
  imports: [
    ConfigModule,
    LoadTestAuthModule,
    ZeebeModule.forRoot(),
    DatabaseModule,
    LoadTestHttpModule,
  ],
  controllers: [WorkflowController],
  providers: [WorkflowDataLoadService],
})
export class LoadTestModule {}
