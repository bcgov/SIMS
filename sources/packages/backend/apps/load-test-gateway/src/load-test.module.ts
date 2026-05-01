import { Module } from "@nestjs/common";
import {
  ApplicationSubmissionController,
  WorkflowAssessmentSubmissionController,
} from "./route-controllers";
import { ConfigModule } from "@sims/utilities/config";
import { DatabaseModule } from "@sims/sims-db";
import {
  ApplicationSubmissionService,
  WorkflowDataLoadService,
} from "./services";
import { ZeebeModule } from "@sims/services";
import { LoadTestAuthModule } from "./auth/load-test-auth.module";
import { LoggerModule } from "@sims/utilities/logger";
import { LoadTestHttpModule } from "./load-test-http/load-test-http.module";
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
  controllers: [
    WorkflowAssessmentSubmissionController,
    ApplicationSubmissionController,
  ],
  providers: [
    WorkflowDataLoadService,
    ApplicationSubmissionService,
    {
      provide: APP_FILTER,
      useClass: LoadTestAllExceptionsFilter,
    },
  ],
})
export class LoadTestModule {}
