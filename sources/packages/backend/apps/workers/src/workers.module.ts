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
} from "./services";
import { ZeebeTransportStrategy } from "./zeebe";
import { ZeebeModule } from "@sims/services";

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
  ],
})
export class WorkersModule {}
