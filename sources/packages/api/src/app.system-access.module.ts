import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import {
  ApplicationExceptionService,
  ConfigService,
  DisbursementScheduleService,
  EducationProgramOfferingService,
  SequenceControlService,
  StudentAssessmentService,
  StudentRestrictionService,
  WorkflowActionsService,
  WorkflowService,
  RestrictionService,
} from "./services";
import {
  ApplicationExceptionSystemAccessController,
  AssessmentControllerService,
  AssessmentSystemAccessController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [
    AssessmentSystemAccessController,
    ApplicationExceptionSystemAccessController,
  ],
  providers: [
    ConfigService,
    WorkflowActionsService,
    WorkflowService,
    StudentAssessmentService,
    EducationProgramOfferingService,
    DisbursementScheduleService,
    SequenceControlService,
    StudentRestrictionService,
    AssessmentControllerService,
    RestrictionService,
    ApplicationExceptionService,
  ],
})
export class AppSystemAccessModule {}
