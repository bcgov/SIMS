import { Module } from "@nestjs/common";
import { WorkflowAssessmentSubmissionController } from "./route-controllers";
import { ConfigModule } from "@sims/utilities/config";
import { DatabaseModule } from "@sims/sims-db";
import { WorkflowDataLoadService } from "./services";
import { ZeebeModule } from "@sims/services";
import { LoadTestAuthModule } from "./auth/load-test-auth.module";
import { LoadTestHttpModule } from "./load-test-http/load-test-http.module";
import { LoggerModule } from "@sims/utilities/logger";
import { APP_FILTER } from "@nestjs/core/constants";
import { LoadTestAllExceptionsFilter } from "./load-test-exception.filter";

@Module({
  imports: [
    ConfigModule,
    LoadTestAuthModule,
    ZeebeModule.forRoot(),
    DatabaseModule,
    LoggerModule,
    LoadTestHttpModule,
  ],
  controllers: [WorkflowAssessmentSubmissionController],
  providers: [
    WorkflowDataLoadService,
    {
      provide: APP_FILTER,
      useClass: LoadTestAllExceptionsFilter,
    },
  ],
})
export class LoadTestModule {}
