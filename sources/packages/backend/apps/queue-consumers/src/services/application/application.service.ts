import { Injectable } from "@nestjs/common";
import { Brackets, Repository } from "typeorm";
import {
  Application,
  ApplicationStatus,
  User,
  StudentAssessment,
  StudentAssessmentStatus,
  DisabilityStatus,
  DisbursementScheduleStatus,
  NotificationMessageType,
  Notification,
  DisbursementSchedule,
} from "@sims/sims-db";
import { ConfigService } from "@sims/utilities/config";
import { InjectRepository } from "@nestjs/typeorm";
import { addDays, DISABILITY_NOTIFICATION_DAYS_LIMIT } from "@sims/utilities";

interface SecondDisbursementStillPending {
  assessmentId: number;
  userId: number;
  givenNames: string;
  lastName: string;
  email: string;
}

@Injectable()
export class ApplicationService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(StudentAssessment)
    private readonly studentAssessmentRepo: Repository<StudentAssessment>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(DisbursementSchedule)
    private readonly disbursementScheduleRepo: Repository<DisbursementSchedule>,
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
  async getApplicationWithPDPPStatusMismatch(): Promise<Application[]> {
    const disabilityNotificationDateLimit = addDays(
      DISABILITY_NOTIFICATION_DAYS_LIMIT,
    );
    // Sub query to defined if a notification was already sent to the current assessment.
    const notificationExistsQuery = this.notificationRepo
      .createQueryBuilder("notification")
      .select("1")
      .where("notification.notificationMessage.id = :messageId")
      .andWhere(
        "notification.metadata->>'assessmentId' = currentAssessment.id :: text",
      )
      .getQuery();
    // Sub query to defined if there is at least on disbursement pending to be sent.
    const pendingDisbursementExistsQuery = this.disbursementScheduleRepo
      .createQueryBuilder("disbursement")
      .select("1")
      .where("disbursement.studentAssessment.id = currentAssessment.id")
      .andWhere(
        "disbursement.disbursementScheduleStatus = :disbursementScheduleStatusPending",
      )
      .getQuery();
    return this.applicationRepo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "application.applicationNumber",
        "student.id",
        "user.id",
        "user.firstName",
        "user.lastName",
        "user.email",
        "currentAssessment.id",
      ])
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("currentAssessment.offering", "offering")
      .where(
        "application.applicationStatus IN (:applicationStatusCompleted, :applicationStatusAssessment)",
        {
          applicationStatusCompleted: ApplicationStatus.Completed,
          applicationStatusAssessment: ApplicationStatus.Assessment,
        },
      )
      .andWhere("offering.studyEndDate <= :disabilityNotificationDateLimit", {
        disabilityNotificationDateLimit,
      })
      .andWhere("student.disabilityStatus NOT IN (:pdStatus, :ppdStatus)", {
        pdStatus: DisabilityStatus.PD,
        ppdStatus: DisabilityStatus.PPD,
      })
      .andWhere(
        'currentAssessment.workflow_data @> \'{ "calculatedData": { "pdppdStatus": true}}\'',
      )
      .andWhere("application.isArchived = false")
      .andWhere(`EXISTS (${pendingDisbursementExistsQuery})`)
      .andWhere(`NOT EXISTS (${notificationExistsQuery})`)
      .setParameters({
        messageId: NotificationMessageType.StudentPDPPDApplicationNotification,
        disbursementScheduleStatusPending: DisbursementScheduleStatus.Pending,
      })
      .getMany();
  }

  /**
   * Retrieves second disbursements eligible for a specific notification (likely disbursement
   * date has passed and the institution has not yet approved the second COE/disbursement).
   * This method applies several criteria to filter eligible disbursements:
   * - There's a pending disbursement schedule
   * - Application status is completed
   * - No notification of this type (messageId 30) has been sent for this assessment
   * - Disbursement date has passed today
   * @returns An array of eligible disbursements with relevant details for notification.
   */
  async getSecondDisbursementsStillPending(): Promise<
    SecondDisbursementStillPending[]
  > {
    // Sub query to defined if a notification was already sent to the current assessment.
    const notificationExistsQuery = this.notificationRepo
      .createQueryBuilder("notification")
      .select("1")
      .where("notification.notificationMessage.id = :messageId")
      .andWhere(
        "notification.metadata->>'assessmentId' = assessment.id :: text",
      )
      .getQuery();
    // Retrieves disbursements with disbursement date has passed today and notification
    // has not been sent for completed applications.
    const disbursements = await this.disbursementScheduleRepo
      .createQueryBuilder("disbursement")
      .select("COUNT(assessment.id)", "assessmentCount")
      .addSelect("MAX(disbursement.id)", "disbursementId")
      .innerJoin("disbursement.studentAssessment", "assessment")
      .innerJoin("assessment.application", "application")
      .where(`NOT EXISTS (${notificationExistsQuery})`)
      .andWhere("application.applicationStatus = :applicationStatusCompleted")
      .andWhere("disbursement.disbursementDate < :today")
      .groupBy("assessment.id")
      .setParameters({
        messageId:
          NotificationMessageType.StudentSecondDisbursementNotification,
        applicationStatusCompleted: ApplicationStatus.Completed,
        today: "2025-02-17", //getISODateOnlyString(new Date()),
      })
      .getRawMany();
    // Filter out the second disbursements.
    const secondDisbursements = disbursements.filter(
      (disbursement) => disbursement.assessmentCount === "2",
    );
    if (secondDisbursements.length === 0) {
      return [];
    }
    // Return second disbursements still pending.
    return await this.disbursementScheduleRepo
      .createQueryBuilder("disbursement")
      .select("assessment.id", "assessmentId")
      .addSelect("user.id", "userId")
      .addSelect("user.firstName", "givenNames")
      .addSelect("user.lastName", "lastName")
      .addSelect("user.email", "email")
      .innerJoin("disbursement.studentAssessment", "assessment")
      .innerJoin("assessment.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("disbursement.id IN (:...disbursementIds)")
      .andWhere(
        "disbursement.disbursementScheduleStatus = :disbursementScheduleStatusPending",
      )
      .setParameters({
        disbursementIds: secondDisbursements.map(
          (secondDisbursement) => secondDisbursement.disbursementId,
        ),
        disbursementScheduleStatusPending: DisbursementScheduleStatus.Pending,
      })
      .getRawMany();
  }
}
