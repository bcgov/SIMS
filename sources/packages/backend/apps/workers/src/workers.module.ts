import { Module } from "@nestjs/common";
import { AssessmentController } from "./controllers/assessment/assessment.controller";
import { StudentAssessmentService } from "./services/student-assessment/student-assessment.service";
import { DatabaseModule } from "@sims/sims-db";

@Module({
  imports: [DatabaseModule],
  controllers: [AssessmentController],
  providers: [StudentAssessmentService],
})
export class WorkersModule {}
