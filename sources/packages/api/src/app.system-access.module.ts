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
  SupportingUserService,
  CRAIncomeVerificationService,
  ApplicationService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  StudentFileService,
  MSFAANumberService,
} from "./services";
import {
  ApplicationExceptionSystemAccessController,
  AssessmentControllerService,
  AssessmentSystemAccessController,
  ApplicationSystemAccessController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import { SINValidationModule } from "./esdc-integration/sin-validation/sin-validation.module";
import { SINValidationSystemAccessController } from "./route-controllers/esdc-integration/sin-validation.system-access.controller";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule, SINValidationModule],
  controllers: [
    AssessmentSystemAccessController,
    ApplicationExceptionSystemAccessController,
    SINValidationSystemAccessController,
    ApplicationSystemAccessController,
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
    SupportingUserService,
    CRAIncomeVerificationService,
    ApplicationService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    StudentFileService,
    MSFAANumberService,
  ],
})
export class AppSystemAccessModule {}
