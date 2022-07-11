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
  CRAPersonalVerificationService,
  CRAIntegrationService,
  SshService,
} from "./services";
import {
  ApplicationExceptionSystemAccessController,
  AssessmentControllerService,
  AssessmentSystemAccessController,
  ApplicationSystemAccessController,
  CRAIntegrationSystemAccessController,
  MSFAAIntegrationSystemAccessController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import { SINValidationModule } from "./esdc-integration/sin-validation/sin-validation.module";
import { SINValidationSystemAccessController } from "./route-controllers/esdc-integration/sin-validation.system-access.controller";
import { MSFAARequestService } from "./esdc-integration/msfaa-integration/msfaa-request.service";
import { MSFAAIntegrationService } from "./esdc-integration/msfaa-integration/msfaa-integration.service";
import { MSFAAResponseService } from "./esdc-integration/msfaa-integration/msfaa-response.service";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule, SINValidationModule],
  controllers: [
    AssessmentSystemAccessController,
    ApplicationExceptionSystemAccessController,
    SINValidationSystemAccessController,
    ApplicationSystemAccessController,
    CRAIntegrationSystemAccessController,
    MSFAAIntegrationSystemAccessController,
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
    CRAPersonalVerificationService,
    CRAIntegrationService,
    SshService,
    MSFAARequestService,
    MSFAAIntegrationService,
    MSFAAResponseService,
  ],
})
export class AppSystemAccessModule {}
