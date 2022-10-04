import { Controller } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe/zeebe-worker.decorator";
import {
  ZeebeJob,
  ICustomHeaders,
  MustReturnJobActionAcknowledgement,
} from "zeebe-node";
import {
  AssessmentDataWorkerInDTO,
  AssessmentDataWorkerOutDTO,
} from "./assessment.dto";
import { StudentAssessmentService } from "../../services/student-assessment/student-assessment.service";

@Controller()
export class AssessmentController {
  constructor(
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {}

  /**
   * This is a sample code to demonstrated the workers feature.
   * @param job information to execute the work.
   * @returns job completion or job failure information.
   */
  @ZeebeWorker("load-assessment-data")
  async loadAssessmentData(
    job: Readonly<
      ZeebeJob<
        AssessmentDataWorkerInDTO,
        ICustomHeaders,
        AssessmentDataWorkerOutDTO
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const assessment = await this.studentAssessmentService.getById(
      job.variables.assessmentId,
    );
    if (!assessment) {
      return job.fail("Assessment not found.");
    }
    return job.complete({ data: assessment.application.data });
  }
}
