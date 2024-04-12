import { Injectable } from "@nestjs/common";
import { StudentAssessment } from "@sims/sims-db";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Manages the student assessment related operations.
 */
@Injectable()
export class StudentAssessmentSharedService {
  constructor(
    @InjectRepository(StudentAssessment)
    private readonly studentAssessmentRepo: Repository<StudentAssessment>,
  ) {}

  /**
   * Get the student id for the assessment.
   * @param assessmentId assessment id.
   * @returns student id.
   */
  async getStudentId(assessmentId: number): Promise<StudentAssessment> {
    return this.studentAssessmentRepo.findOne({
      select: { application: { student: { id: true } } },
      relations: { application: { student: true } },
      where: { id: assessmentId },
    });
  }
}
