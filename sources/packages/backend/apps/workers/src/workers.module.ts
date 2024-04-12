import { Module } from "@nestjs/common";
import { DatabaseModule } from "@sims/sims-db";
import {
  AssessmentController,
  ApplicationController,
  ProgramInfoRequestController,
  SupportingUserController,
  CRAIntegrationController,
  DisbursementController,
  HealthController,
} from "./controllers";
import {
  StudentAssessmentService,
  ApplicationService,
  ApplicationExceptionService,
  SupportingUserService,
  CRAIncomeVerificationService,
  MSFAANumberService,
  DisbursementScheduleService,
} from "./services";
import { ZeebeHealthIndicator, ZeebeTransportStrategy } from "./zeebe";
import {
  DisbursementScheduleSharedService,
  SequenceControlService,
  WorkflowClientService,
  ZeebeModule,
  DisbursementOverawardService,
  NotificationsModule,
  NoteSharedService,
  MSFAANumberSharedService,
  ConfirmationOfEnrollmentService,
  GlobalHttpModule,
  AssessmentSequentialProcessingService,
} from "@sims/services";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";
import { SystemUserModule } from "@sims/services/system-users";
import { TerminusModule } from "@nestjs/terminus";

@Module({
  imports: [
    GlobalHttpModule,
    DatabaseModule,
    ConfigModule,
    LoggerModule,
    ZeebeModule.forRoot(),
    SystemUserModule,
    NotificationsModule,
    TerminusModule,
  ],
  controllers: [
    AssessmentController,
    ApplicationController,
    ProgramInfoRequestController,
    SupportingUserController,
    CRAIntegrationController,
    DisbursementController,
    HealthController,
  ],
  providers: [
    ZeebeTransportStrategy,
    WorkflowClientService,
    StudentAssessmentService,
    ApplicationService,
    ApplicationExceptionService,
    SupportingUserService,
    CRAIncomeVerificationService,
    DisbursementScheduleSharedService,
    DisbursementScheduleService,
    SequenceControlService,
    MSFAANumberService,
    MSFAANumberSharedService,
    DisbursementOverawardService,
    NoteSharedService,
    ConfirmationOfEnrollmentService,
    ZeebeHealthIndicator,
    AssessmentSequentialProcessingService,
  ],
})
export class WorkersModule {}
