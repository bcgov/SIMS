import { Injectable } from "@nestjs/common";
import { ApplicationData, StudentAssessment } from "@sims/sims-db";
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
        application: {
          applicationStatus: true,
        },
      },
      relations: {
        application: true,
      },
      where: {
        id: assessmentId,
      },
    });
  }

  async getApplicationDynamicData(
    assessmentId: number,
  ): Promise<Partial<ApplicationData>> {
    const data = await this.studentAssessmentRepo
      .createQueryBuilder("studentAssessment")
      .select("application.data ->> 'workflowName'", "workflowName")
      .innerJoin("studentAssessment.application", "application")
      .where("studentAssessment.id = :assessmentId", { assessmentId })
      .getRawOne();
    return {
      workflowName: data.workflowName,
    };
  }
}
