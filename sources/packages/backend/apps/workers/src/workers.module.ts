import { Module } from "@nestjs/common";
import { DatabaseModule } from "@sims/sims-db";
import {
  AssessmentController,
  ApplicationController,
  ProgramInfoRequestController,
} from "./controllers";
import {
  StudentAssessmentService,
  ApplicationService,
  ApplicationExceptionService,
} from "./services";

@Module({
  imports: [DatabaseModule],
  controllers: [
    AssessmentController,
    ApplicationController,
    ProgramInfoRequestController,
  ],
  providers: [
    StudentAssessmentService,
    ApplicationService,
    ApplicationExceptionService,
  ],
})
export class WorkersModule {}
