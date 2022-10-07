import { Module } from "@nestjs/common";
import { AssessmentController } from "./controllers/assessment/assessment.controller";
import { StudentAssessmentService } from "./services/student-assessment/student-assessment.service";
import { DatabaseModule } from "@sims/sims-db";
import { ApplicationController } from "./controllers/application/application.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [AssessmentController, ApplicationController],
  providers: [StudentAssessmentService],
})
export class WorkersModule {}
