import { Injectable } from "@nestjs/common";
import { Brackets, Repository, SelectQueryBuilder } from "typeorm";
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
  COEStatus,
  ApplicationEditStatus,
  AssessmentStatus,
  QueryAndParamsForExecution,
} from "@sims/sims-db";
import { ConfigService } from "@sims/utilities/config";
import { LoggerService } from "@sims/utilities/logger";
import { InjectRepository } from "@nestjs/typeorm";
import {
  addDays,
  DISABILITY_NOTIFICATION_DAYS_LIMIT,
  processInParallel,
  STUDENT_COE_REQUIRED_NOTIFICATION_END_DATE_DAYS,
} from "@sims/utilities";
import { STUDENT_ASSESSMENT_NOTIFICATION_OVERDUE_DAYS } from "@sims/services/constants";
import { ECertPreValidationService } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import { ECertFailedValidation } from "@sims/integrations/services";
import { RestrictionCode } from "@sims/services";

interface SecondDisbursementStillPending {
  assessmentId: number;
  userId: number;
  givenNames: string;
  lastName: string;
  email: string;
}

/**
 * Represents a student with COE required near their study end date.
 */
interface COERequiredNearEndDate {
  assessmentId: number;
  userId: number;
  givenNames?: string;
  lastName: string;
  email: string;
  applicationNumber: string;
}

@Injectable()
export class ApplicationService {
  /**
   * Sub query to validate if an application has assessment already being
   * processed by the workflow.
   */
  private readonly inProgressStatusesExistsQuery: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly eCertPreValidationService: ECertPreValidationService,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(StudentAssessment)
    private readonly studentAssessmentRepo: Repository<StudentAssessment>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(DisbursementSchedule)
    private readonly disbursementScheduleRepo: Repository<DisbursementSchedule>,
    private readonly logger: LoggerService,
  ) {
    this.inProgressStatusesExistsQuery = this.studentAssessmentRepo
      .createQueryBuilder("studentAssessment")
      .select("1")
      .where("studentAssessment.application.id = application.id")
      .andWhere(
        "studentAssessment.studentAssessmentStatus IN (:...inProgressStatuses)",
      )
      .getQuery();
  }

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
        .andWhere(
          new Brackets((qb) => {
            qb.where("application.applicationStatus IN (:...status)", {
              status: [
                ApplicationStatus.Submitted,
                ApplicationStatus.InProgress,
                ApplicationStatus.Assessment,
                ApplicationStatus.Enrolment,
                ApplicationStatus.Completed,
              ],
            }).orWhere(
              new Brackets((qb) => {
                qb.where(
                  "application.applicationStatus = :editedStatus",
                ).andWhere(
                  "application.applicationEditStatus = :changeInProgressStatus",
                );
              }),
            );
          }),
        )
        .andWhere(
          "studentAssessment.studentAssessmentStatus = :submittedStatus",
          {
            submittedStatus: StudentAssessmentStatus.Submitted,
          },
        )
        .andWhere(`NOT EXISTS (${this.inProgressStatusesExistsQuery})`)
        .setParameters({
          editedStatus: ApplicationStatus.Edited,
          changeInProgressStatus: ApplicationEditStatus.ChangeInProgress,
          inProgressStatuses: [
            StudentAssessmentStatus.Queued,
            StudentAssessmentStatus.InProgress,
            // This conditions may not be directly related to the current application logic but has been added to ensure that
            // at any given time now or future the queue does not pick an application to cancel when there is already an
            // assessment for that application which is queued for cancellation.
            StudentAssessmentStatus.CancellationRequested,
            StudentAssessmentStatus.CancellationQueued,
          ],
        })
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
  async getApplicationWithPDPPDStatusMismatch(): Promise<Application[]> {
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
   * - No notification of this type has been sent for this assessment
   * - Disbursement date has passed today
   * @returns An array of eligible disbursements with relevant details for notification.
   */
  async getSecondDisbursementsCOEStillPending(): Promise<
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
    // Sub query to retrieve second disbursements as a with disbursement date has
    // passed today and notification has not been sent for completed applications.
    const secondDisbursementsQuery = this.disbursementScheduleRepo
      .createQueryBuilder("disbursement")
      .select("MAX(disbursement.id)", "id")
      .innerJoin("disbursement.studentAssessment", "assessment")
      .innerJoin("assessment.application", "application")
      .where(`NOT EXISTS (${notificationExistsQuery})`)
      .andWhere("application.applicationStatus = :applicationStatusCompleted")
      .andWhere("application.isArchived = false")
      .andWhere("disbursement.disbursementDate < CURRENT_DATE")
      .andWhere("disbursement.coeStatus IN (:...coeStatus)")
      .groupBy("assessment.id")
      .having("COUNT(assessment.id) = 2")
      .getQuery();
    // Return second disbursements still pending.
    return this.disbursementScheduleRepo
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
      .where(`disbursement.id IN (${secondDisbursementsQuery})`)
      .andWhere("disbursement.coeStatus = :coeStatusRequired")
      .andWhere(
        "disbursement.disbursementScheduleStatus = :disbursementScheduleStatusPending",
      )
      .setParameters({
        messageId:
          NotificationMessageType.StudentSecondDisbursementNotification,
        applicationStatusCompleted: ApplicationStatus.Completed,
        coeStatus: [COEStatus.completed, COEStatus.required],
        coeStatusRequired: COEStatus.required,
        disbursementScheduleStatusPending: DisbursementScheduleStatus.Pending,
      })
      .getRawMany();
  }

  /**
   * Retrieves applications with at least one COE required on the most recent assessment
   * where the study end date is within 10 calendar days. This method applies several
   * criteria to filter eligible applications:
   * - Application status is Enrolment or Completed.
   * - At least one disbursement with COE status 'required'.
   * - Study end date is within 10 days from today.
   * - No notification of this type has been sent for this assessment.
   * @returns An array of eligible applications with relevant details for notification.
   */
  async getCOERequiredNearEndDate(): Promise<COERequiredNearEndDate[]> {
    // Sub query to check if a notification was already sent for the current assessment.
    const notificationExistsQuery = this.notificationRepo
      .createQueryBuilder("notification")
      .select("1")
      .where("notification.notificationMessage.id = :messageId")
      .andWhere(
        "notification.metadata->>'assessmentId' = assessment.id :: text",
      )
      .getQuery();

    // Main query to retrieve applications with COE required near study end date.
    return this.disbursementScheduleRepo
      .createQueryBuilder("disbursement")
      .select("assessment.id", "assessmentId")
      .addSelect("user.id", "userId")
      .addSelect("user.firstName", "givenNames")
      .addSelect("user.lastName", "lastName")
      .addSelect("user.email", "email")
      .addSelect("application.applicationNumber", "applicationNumber")
      .innerJoin("disbursement.studentAssessment", "assessment")
      .innerJoin("assessment.application", "application")
      .innerJoin("assessment.offering", "offering")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where(`NOT EXISTS (${notificationExistsQuery})`)
      .andWhere("assessment.id = application.currentAssessment.id")
      .andWhere("application.applicationStatus IN (:...applicationStatuses)")
      .andWhere("application.isArchived = false")
      .andWhere("disbursement.coeStatus = :coeStatusRequired")
      .andWhere(
        `offering.studyEndDate BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${STUDENT_COE_REQUIRED_NOTIFICATION_END_DATE_DAYS} days'`,
      )
      .distinct(true)
      .setParameters({
        messageId:
          NotificationMessageType.StudentCOERequiredNearEndDateNotification,
        applicationStatuses: [
          ApplicationStatus.Assessment,
          ApplicationStatus.Enrolment,
          ApplicationStatus.Completed,
        ],
        coeStatusRequired: COEStatus.required,
      })
      .getRawMany();
  }

  /**
   * Retrieve applications with overdue assessments that have been assessed at least 7 days.
   * Only assessments that haven't already been notified should be included.
   * @returns overdue assessments.
   */
  async getApplicationsWithOverdueAssessments(): Promise<Application[]> {
    // Sub query to defined if a notification was already sent to the current assessment.
    const {
      query: notificationExistsQuery,
      parameters: notificationExistsParameters,
    } = this.getNotificationExistsSubQuery(
      NotificationMessageType.StudentAssessmentReminder,
      {
        assessmentMetadata: { parentQueryAssessmentAlias: "currentAssessment" },
      },
    );

    const applications = await this.getPendingAcceptAssessmentBaseQuery()
      .andWhere(
        "currentAssessment.noaApprovalStatusUpdatedOn < NOW() - (:overdueDays * INTERVAL '1 day')",
        {
          overdueDays: STUDENT_ASSESSMENT_NOTIFICATION_OVERDUE_DAYS,
        },
      )
      .andWhere("offering.studyEndDate >= CURRENT_DATE")
      .andWhere(
        `NOT EXISTS (${notificationExistsQuery})`,
        notificationExistsParameters,
      )
      .getMany();

    const eligibleApplications: Application[] = [];
    //TODO: This execution can be improved by using the newly created executeAcceptAssessmentValidations.
    await processInParallel(async (application) => {
      const validationResult =
        await this.eCertPreValidationService.executePreValidations(
          application.id,
          true,
        );
      if (validationResult.canAcceptAssessment) {
        eligibleApplications.push(application);
      }
    }, applications);
    return eligibleApplications;
  }

  /**
   * Get application that are blocked at accept assessment due to program suspension restriction.
   * @returns applications with assessments blocked by program suspension restriction.
   */
  async getApplicationsBlockedByProgramSuspension(): Promise<Application[]> {
    // Sub query to defined if a notification was already sent to the current assessment.
    const {
      query: notificationExistsQuery,
      parameters: notificationExistsParameters,
    } = this.getNotificationExistsSubQuery(
      NotificationMessageType.ProgramSuspensionBlockingApplication,
      {
        assessmentMetadata: { parentQueryAssessmentAlias: "currentAssessment" },
      },
    );
    // Get all applications pending for accept assessment and that have not been notified yet
    // about the program suspension restriction blocking the assessment acceptance.
    // As these applications are retrieved to be validated further for effective program suspension restriction
    // applications from institutions having active restrictions only are considered to be more relevant for the validation.
    const applicationsPendingAcceptAssessment =
      await this.getPendingAcceptAssessmentBaseQuery()
        .innerJoin("institution.restrictions", "institutionRestriction")
        .andWhere("institutionRestriction.isActive = true")
        .andWhere("application.isArchived = false")
        .andWhere(
          `NOT EXISTS (${notificationExistsQuery})`,
          notificationExistsParameters,
        )
        .getMany();
    if (!applicationsPendingAcceptAssessment.length) {
      return [];
    }
    this.logger.log(
      `Number of applications from restricted institutions pending accept assessment: ${applicationsPendingAcceptAssessment.length}`,
    );
    // Get the accept assessment validation results for the applications pending accept assessment.
    const applicationIds = applicationsPendingAcceptAssessment.map(
      (application) => application.id,
    );
    const acceptAssessmentValidationResults =
      await this.eCertPreValidationService.executeAcceptAssessmentValidations(
        applicationIds,
      );
    const applicationIdsBlockedByProgramSuspension =
      acceptAssessmentValidationResults
        .filter(
          (validation) =>
            !validation.validationResult.canAcceptAssessment &&
            validation.validationResult.failedValidations.some(
              (failedValidation) =>
                failedValidation.resultType ===
                  ECertFailedValidation.HasStopDisbursementInstitutionRestriction &&
                failedValidation.additionalInfo.restrictions.some(
                  (restriction) => restriction.code === RestrictionCode.SUS,
                ),
            ),
        )
        .map((validationResult) => validationResult.applicationId);
    if (!applicationIdsBlockedByProgramSuspension.length) {
      return [];
    }
    return applicationsPendingAcceptAssessment.filter((application) =>
      applicationIdsBlockedByProgramSuspension.includes(application.id),
    );
  }

  /**
   * Get existing notification sub query for a specific notification message type and options if provided.
   * @param notificationMessageId notification message type id to check for existing notifications.
   * @param options optional parameters to customize the sub query, such as assessment parent alias.
   * - `parentQueryAssessmentAlias` student id for the student.
   * @returns query and parameters to be used in the parent query builder.
   */
  private getNotificationExistsSubQuery(
    notificationMessageId: NotificationMessageType,
    options?: {
      assessmentMetadata?: {
        parentQueryAssessmentAlias: string;
      };
    },
  ): QueryAndParamsForExecution {
    const notificationExistsQuery = this.notificationRepo
      .createQueryBuilder("notification")
      .select("1")
      .where("notification.notificationMessage.id = :notificationMessageId");
    if (options?.assessmentMetadata?.parentQueryAssessmentAlias) {
      notificationExistsQuery.andWhere(
        `notification.metadata->>'assessmentId' = ${options.assessmentMetadata.parentQueryAssessmentAlias}.id :: text`,
      );
    }
    return {
      query: notificationExistsQuery.getQuery(),
      parameters: { notificationMessageId },
    };
  }

  /**
   * Get pending accept assessment base query to retrieve applications with pending assessment.
   * @returns base query builder for pending accept assessments.
   */
  private getPendingAcceptAssessmentBaseQuery(): SelectQueryBuilder<Application> {
    return this.applicationRepo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "application.applicationNumber",
        "currentAssessment.id",
        "student.id",
        "student.birthDate",
        "user.id",
        "user.firstName",
        "user.lastName",
        "user.email",
        "offering.id",
        "program.id",
        "program.name",
        "location.id",
        "institution.id",
        "institution.operatingName",
      ])
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.educationProgram", "program")
      .innerJoin("offering.institutionLocation", "location")
      .innerJoin("location.institution", "institution")
      .where("currentAssessment.noaApprovalStatus = :noaApprovalStatus", {
        noaApprovalStatus: AssessmentStatus.required,
      })
      .andWhere("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.Assessment,
      })
      .andWhere(
        "currentAssessment.studentAssessmentStatus = :studentAssessmentStatus",
        {
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      );
  }
}
