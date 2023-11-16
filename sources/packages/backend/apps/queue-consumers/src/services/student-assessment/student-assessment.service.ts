import { Injectable } from "@nestjs/common";
import {
  ApplicationData,
  StudentAssessment,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { LessThan, Repository } from "typeorm";
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
        studentAssessmentStatus: true,
      },
      relations: {
        application: true,
      },
      where: {
        id: assessmentId,
      },
    });
  }

  /**
   * The the student application dynamic data using the assessment id.
   * @param assessmentId assessment id.
   * @returns student application dynamic data.
   */
  async getApplicationDynamicData(
    assessmentId: number,
  ): Promise<ApplicationData> {
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

  /**
   * Retrieve assessment cancellations to be retried up to a date.
   * @param retryMaxDate max date to retrieve assessment cancellations to be retried.
   * @returns student assessment cancellations to be retried.
   */
  async getAssessmentCancellationsRequestedToBeRetried(
    retryMaxDate: Date,
  ): Promise<StudentAssessment[]> {
    return this.studentAssessmentRepo.find({
      select: {
        id: true,
      },
      where: {
        studentAssessmentStatus: StudentAssessmentStatus.CancellationQueued,
        updatedAt: LessThan(retryMaxDate),
      },
    });
  }

  /**
   * Retrieve assessment start to be retried up to a date.
   * @param retryMaxDate max date to retrieve assessment start to be retried.
   * @returns student assessment start to be retried.
   */
  async getAssessmentQueuedToBeRetried(
    retryMaxDate: Date,
  ): Promise<StudentAssessment[]> {
    return this.studentAssessmentRepo.find({
      select: {
        id: true,
      },
      where: {
        studentAssessmentStatus: StudentAssessmentStatus.Queued,
        updatedAt: LessThan(retryMaxDate),
      },
    });
  }
}
