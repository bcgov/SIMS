import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import {
  ConfigService,
  EducationProgramOfferingService,
  StudentAssessmentService,
  WorkflowActionsService,
  WorkflowService,
} from "./services";
import { AssessmentSystemAccessController } from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [AssessmentSystemAccessController],
  providers: [
    ConfigService,
    WorkflowActionsService,
    WorkflowService,
    StudentAssessmentService,
    EducationProgramOfferingService,
  ],
})
export class AppSystemAccessModule {}
