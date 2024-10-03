import { Injectable } from "@nestjs/common";
import { Brackets, Repository } from "typeorm";
import {
  Application,
  ApplicationStatus,
  User,
  StudentAssessment,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { ConfigService } from "@sims/utilities/config";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class ApplicationService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(StudentAssessment)
    private readonly studentAssessmentRepo: Repository<StudentAssessment>,
  ) {}

  /**
   * Archives one or more applications when application archive days
   * configuration have passed the end of the study period.
   * @param auditUserId user making changes to table.
   * @return the number of applications that were archived.
   */
  async archiveApplications(auditUserId: number): Promise<number> {
    const auditUser = { id: auditUserId } as User;

    // Build sql statement to get all application ids to archive
    const applicationsToArchive = this.applicationRepo
      .createQueryBuilder("application")
      .select("application.id")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .where("application.applicationStatus = :completed")
      .andWhere(
        "(CURRENT_DATE - offering.studyEndDate) > :applicationArchiveDays",
      )
      .andWhere("application.isArchived <> :isApplicationArchived")
      .getSql();

    const updateResult = await this.applicationRepo
      .createQueryBuilder()
      .update(Application)
      .set({ isArchived: true, modifier: auditUser })
      .where(`applications.id IN (${applicationsToArchive})`)
      .setParameter("completed", ApplicationStatus.Completed)
      .setParameter(
        "applicationArchiveDays",
        this.configService.applicationArchiveDays,
      )
      .setParameter("isApplicationArchived", true)
      .execute();

    return updateResult.affected;
  }

  /**
   * Sub query to validate if an application has assessment already being
   * processed by the workflow.
   */
  private inProgressStatusesExistsQuery = this.studentAssessmentRepo
    .createQueryBuilder("studentAssessment")
    .select("1")
    .where("studentAssessment.application.id = application.id")
    .andWhere(
      "studentAssessment.studentAssessmentStatus IN (:...inProgressStatuses)",
    )
    .getQuery();

  /**
   * Finds all applications with some pending student assessment to be
   * processed by the workflow, ignoring applications that already have
   * some workflows in progress or were already queued for execution.
   * All pending student assessments will be returned ordered by its creation
   * date to allow the select of the next one to be executed (usually only one
   * record would be expected).
   * @returns applications with pending assessments to be executed.
   */
  async getApplicationsToStartAssessments(): Promise<Application[]> {
    return (
      this.applicationRepo
        .createQueryBuilder("application")
        .select(["application.id", "studentAssessment.id"])
        .innerJoin("application.studentAssessments", "studentAssessment")
        // currentProcessingAssessment will be null for the original assessment and it must be
        // updated every time that a workflow is triggered.
        // When currentProcessingAssessment and currentAssessment are different it indicates that
        // there is a assessment workflow pending to be executed.
        .where(
          new Brackets((qb) => {
            qb.where("application.currentProcessingAssessment IS NULL").orWhere(
              "application.currentProcessingAssessment != application.currentAssessment",
            );
          }),
        )
        .andWhere("application.applicationStatus IN (:...status)", {
          status: [
            ApplicationStatus.Submitted,
            ApplicationStatus.InProgress,
            ApplicationStatus.Assessment,
            ApplicationStatus.Enrolment,
            ApplicationStatus.Completed,
          ],
        })
        .andWhere(
          "studentAssessment.studentAssessmentStatus = :submittedStatus",
          {
            submittedStatus: StudentAssessmentStatus.Submitted,
          },
        )
        .andWhere(`NOT EXISTS (${this.inProgressStatusesExistsQuery})`)
        .setParameter("inProgressStatuses", [
          StudentAssessmentStatus.Queued,
          StudentAssessmentStatus.InProgress,
          // This conditions may not be directly related to the current application logic but has been added to ensure that
          // at any given time now or future the queue does not pick an application to cancel when there is already an
          // assessment for that application which is queued for cancellation.
          StudentAssessmentStatus.CancellationRequested,
          StudentAssessmentStatus.CancellationQueued,
        ])
        .orderBy("studentAssessment.createdAt")
        .getMany()
    );
  }

  /**
   * Finds all applications with some student assessment with cancellation requested.
   * All student assessments to be cancelled will be returned ordered by its creation
   * date to allow the select of the next one to be cancelled.
   * @returns applications with assessment to be cancelled.
   */
  async getApplicationsToCancelAssessments(): Promise<Application[]> {
    return (
      this.applicationRepo
        .createQueryBuilder("application")
        .select(["application.id", "studentAssessment.id"])
        .innerJoin("application.studentAssessments", "studentAssessment")
        .andWhere("studentAssessment.studentAssessmentStatus = :status", {
          status: StudentAssessmentStatus.CancellationRequested,
        })
        // This condition may not be directly related to the current application logic but has been added to ensure that
        // at any given time now or future the queue does not pick an application to cancel when there is already an
        // assessment for that application which is queued for cancellation.
        .andWhere(`NOT EXISTS (${this.inProgressStatusesExistsQuery})`)
        .setParameter("inProgressStatuses", [
          StudentAssessmentStatus.CancellationQueued,
        ])
        .orderBy("studentAssessment.createdAt")
        .getMany()
    );
  }

  /**
   * Retrieves applications eligible for a specific notification (likely related to disability status and PD/PPD status).
   * This method applies several criteria to filter eligible applications:
   * - Study end date is at least 8 weeks in the future
   * - Student's disability status is not 'PD' or 'PPD'
   * - The assessment's workflow data indicates a positive PD/PPD status
   * - The application is not archived
   * - There's a pending disbursement schedule
   * - No notification of this type (messageId 30) has been sent for this assessment
   * @returns An array of eligible applications with relevant details for notification.
   */
  async getEligibleApplicationsForNotification(): Promise<Application[]> {
    const eightWeeksFromNow = new Date();
    eightWeeksFromNow.setDate(eightWeeksFromNow.getDate() + 56); // 8 weeks * 7 days

    return (
      this.applicationRepo
        .createQueryBuilder("application")
        .select([
          "application.applicationNumber",
          "users.firstName",
          "users.lastName",
          "student_assessments.id",
          "students.disabilityStatus",
        ])
        .innerJoin("application.currentAssessment", "student_assessments")
        .innerJoin("application.student", "students")
        .innerJoin("students.user", "users")
        .innerJoin("student_assessments.offering", "epo")
        .innerJoin("student_assessments.disbursementSchedules", "ds")
        // .where("epo.studyEndDate >=  '2024-11-28T00:52:40.005Z'")
        .where("epo.studyEndDate >= :eightWeeksFromNow", { eightWeeksFromNow })
        .andWhere("students.disabilityStatus NOT IN ('PD', 'PPD')")
        .andWhere(
          "json_extract_path_text(student_assessments.workflow_data::json, 'calculatedData', 'pdppdStatus') = 'true'",
        )
        .andWhere("application.isArchived = false")
        .andWhere("ds.disbursementScheduleStatus = 'Pending'")
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select("1")
            .from("notifications", "n")
            .where("n.notification_message_id = 30")
            .andWhere(
              "json_extract_path_text(n.metadata::json, 'assessmentId') = CAST(student_assessments.id AS TEXT)",
            )
            .getQuery();
          return "NOT EXISTS (" + subQuery + ")";
        })
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select("1")
            .from("disbursement_schedules", "ds2")
            .where("ds2.studentAssessment = student_assessments.id")
            .andWhere("ds2.disbursementDate < ds.disbursementDate")
            .getQuery();
          return "NOT EXISTS (" + subQuery + ")";
        })
        .getMany()
    );
  }
}
