import { Module } from "@nestjs/common";
import { DatabaseModule } from "@sims/sims-db";
import {
  AssessmentController,
  ApplicationController,
  ProgramInfoRequestController,
  SupportingUserController,
  CRAIntegrationController,
  DisbursementController,
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
import { ZeebeTransportStrategy } from "./zeebe";
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
} from "@sims/services";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";
import { SystemUserModule } from "@sims/services/system-users";

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    LoggerModule,
    ZeebeModule.forRoot(),
    SystemUserModule,
    NotificationsModule,
  ],
  controllers: [
    AssessmentController,
    ApplicationController,
    ProgramInfoRequestController,
    SupportingUserController,
    CRAIntegrationController,
    DisbursementController,
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
  ],
})
export class WorkersModule {}
