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
} from "./services";
import { ZeebeTransportStrategy } from "./zeebe";
import { SequenceControlService, ZeebeModule } from "@sims/services";

@Module({
  imports: [DatabaseModule, ZeebeModule.forRoot()],
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
    StudentAssessmentService,
    ApplicationService,
    ApplicationExceptionService,
    SupportingUserService,
    CRAIncomeVerificationService,
    DisbursementScheduleService,
    SequenceControlService,
    MSFAANumberService,
  ],
})
export class WorkersModule {}
