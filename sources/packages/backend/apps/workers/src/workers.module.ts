import { Module } from "@nestjs/common";
import { DatabaseModule } from "@sims/sims-db";
import { AssessmentController, ApplicationController } from "./controllers";
import {
  StudentAssessmentService,
  ApplicationService,
  ApplicationExceptionService,
} from "./services";

@Module({
  imports: [DatabaseModule],
  controllers: [AssessmentController, ApplicationController],
  providers: [
    StudentAssessmentService,
    ApplicationService,
    ApplicationExceptionService,
  ],
})
export class WorkersModule {}
