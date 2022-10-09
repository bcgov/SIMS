import { Module } from "@nestjs/common";
import { DatabaseModule } from "@sims/sims-db";
import {
  AssessmentController,
  ApplicationController,
  ProgramInfoRequestController,
  SupportingUserController,
} from "./controllers";
import {
  StudentAssessmentService,
  ApplicationService,
  ApplicationExceptionService,
  SupportingUserService,
} from "./services";

@Module({
  imports: [DatabaseModule],
  controllers: [
    AssessmentController,
    ApplicationController,
    ProgramInfoRequestController,
    SupportingUserController,
  ],
  providers: [
    StudentAssessmentService,
    ApplicationService,
    ApplicationExceptionService,
    SupportingUserService,
  ],
})
export class WorkersModule {}
