import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import {
  ConfigService,
  DisbursementScheduleService,
  EducationProgramOfferingService,
  SequenceControlService,
  StudentAssessmentService,
  StudentRestrictionService,
  WorkflowActionsService,
  WorkflowService,
  StudentAppealService,
  StudentAppealRequestsService,
  StudentScholasticStandingsService,
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
    DisbursementScheduleService,
    SequenceControlService,
    StudentRestrictionService,
    StudentAppealService,
    StudentScholasticStandingsService,
    StudentAppealRequestsService,
  ],
})
export class AppSystemAccessModule {}
