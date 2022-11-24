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
  DisbursementScheduleService,
  MSFAANumberService,
  DisbursementOverawardService,
} from "./services";
import { ZeebeTransportStrategy } from "./zeebe";
import {
  SequenceControlService,
  WorkflowClientService,
  ZeebeModule,
} from "@sims/services";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";

@Module({
  imports: [DatabaseModule, ConfigModule, LoggerModule, ZeebeModule.forRoot()],
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
    DisbursementScheduleService,
    SequenceControlService,
    MSFAANumberService,
    DisbursementOverawardService,
  ],
})
export class WorkersModule {}
