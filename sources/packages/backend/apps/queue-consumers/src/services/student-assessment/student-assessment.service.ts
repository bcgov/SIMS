import { Injectable } from "@nestjs/common";
import {
  ApplicationData,
  ApplicationStatus,
  AssessmentStatus,
  Notification,
  NotificationMessageType,
  StudentAssessment,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { LessThan, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { STUDENT_ASSESSMENT_NOTIFICATION_OVERDUE_DAYS } from "@sims/services/constants/system-configurations-constants";

/**
 * Manages the student assessment related operations
 * for the queue consumers application.
 */
@Injectable()
export class StudentAssessmentService {
  constructor(
    @InjectRepository(StudentAssessment)
    private readonly studentAssessmentRepo: Repository<StudentAssessment>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
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
        disbursementSchedules: { id: true, coeStatus: true },
      },
      relations: {
        application: true,
        disbursementSchedules: true,
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
   * Retrieve assessment to be retried up to a date.
   * @param retryMaxDate max date to retrieve assessment to be retried.
   * @param studentAssessmentStatus student assessment status to be queried.
   * @returns student assessments to be retried.
   */
  async getAssessmentsToBeRetried(
    retryMaxDate: Date,
    studentAssessmentStatus:
      | StudentAssessmentStatus.Queued
      | StudentAssessmentStatus.CancellationQueued,
  ): Promise<StudentAssessment[]> {
    return this.studentAssessmentRepo.find({
      select: {
        id: true,
      },
      where: {
        studentAssessmentStatus,
        studentAssessmentStatusUpdatedOn: LessThan(retryMaxDate),
      },
    });
  }

  /**
   * Retrieve overdue assessments that have been assessed at least 7 days and are unblocked.
   * Only assessments that haven't already been notified should be included.
   * @returns overdue assessments.
   */
  async getOverdueAssessments(): Promise<StudentAssessment[]> {
    // Sub query to defined if a notification was already sent to the current assessment.
    const notificationExistsQuery = this.notificationRepo
      .createQueryBuilder("notification")
      .select("1")
      .innerJoin("notification.notificationMessage", "notificationMessage")
      .where("notificationMessage.id = :notificationMessageId")
      .andWhere(
        "notification.metadata->>'assessmentId' = assessment.id :: text",
      )
      .getQuery();

    return this.studentAssessmentRepo
      .createQueryBuilder("assessment")
      .select([
        "assessment.id",
        "application.applicationNumber",
        "student.id",
        "user.id",
        "user.firstName",
        "user.lastName",
        "user.email",
      ])
      .innerJoin("assessment.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("assessment.noaApprovalStatus = :noaApprovalStatus", {
        noaApprovalStatus: AssessmentStatus.required,
      })
      .andWhere(
        "assessment.noaApprovalStatusUpdatedOn < NOW() - (:overdueDays * INTERVAL '1 day')",
        {
          overdueDays: STUDENT_ASSESSMENT_NOTIFICATION_OVERDUE_DAYS,
        },
      )
      .andWhere("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.Assessment,
      })
      .andWhere(`NOT EXISTS (${notificationExistsQuery})`, {
        notificationMessageId:
          NotificationMessageType.StudentAssessmentReminder,
      })
      .getMany();
  }
}
