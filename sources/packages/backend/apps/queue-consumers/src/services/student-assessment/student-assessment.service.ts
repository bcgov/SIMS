import { Injectable } from "@nestjs/common";
import { StudentAssessment } from "@sims/sims-db";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Manages the student assessment related operations
 * for the queue consumers application.
 */
@Injectable()
export class StudentAssessmentService {
  constructor(
    @InjectRepository(StudentAssessment)
    private readonly studentAssessmentRepo: Repository<StudentAssessment>,
  ) {}

  /**
   * Gets the student assessment by its id.
   * @param assessmentId assessment id.
   * @returns assessment found, otherwise, null.
   */
  async getAssessmentById(assessmentId: number): Promise<StudentAssessment> {
    return this.studentAssessmentRepo.findOne({
      select: {
        id: true,
        assessmentWorkflowId: true,
      },
      where: {
        id: assessmentId,
      },
    });
  }
}
