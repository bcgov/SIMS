import { ECertProcessStep } from "../e-cert-processing-steps/e-cert-steps-models";
import { DataSource, EntityManager } from "typeorm";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  addDays,
  getUTC,
  getUTCNow,
  parseJSONError,
  processInParallel,
} from "@sims/utilities";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { Notification, Student } from "@sims/sims-db";
import {
  DisbursementBlockedNotificationForMinistry,
  NotificationActionsService,
  StudentNotification,
} from "@sims/services";

/**
 * Disbursements grouped by student to allow parallel processing of students
 * and sequential processing of disbursements for the same student.
 */
interface GroupedDisbursementPerStudent {
  [studentId: number]: EligibleECertDisbursement[];
}

interface NotificationData {
  max_created_at: Date;
  notificationsCount: number;
}

/**
 * Base process for e-Cert calculations independently of the offering intensity.
 * Both offering intensity will have similar calculation steps and some additional ones.
 */
export abstract class ECertCalculationProcess {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Get all disbursements currently eligible to be part of
   * an e-Cert to have its calculations executed.
   * The returned array of {@link ECertProcessStep} will be shared across all steps being
   * modified till the disbursement entity model modifications will be saved.
   * @returns eligible disbursements to be validated and calculated.
   * */
  protected abstract getDisbursements(): Promise<EligibleECertDisbursement[]>;

  /**
   * Define the steps to be executed and the execution order.
   * @returns list of calculation steps to be execute sequentially.
   */
  protected abstract calculationSteps(): ECertProcessStep[];

  /**
   * Execute the calculations for all eligible disbursements.
   * @param log cumulative process log.
   */
  async executeCalculations(log: ProcessSummary): Promise<void> {
    log.info("Retrieving eligible disbursements(s).");
    const disbursements = await this.getDisbursements();
    // Group retrieved disbursements per students since a student can
    // potentially have more then one disbursement in the same e-Cert.
    const disbursementsPerStudent =
      this.getGroupedDisbursementsPerStudent(disbursements);
    log.info(
      `Found ${disbursements.length} eligible disbursement(s) for ${
        Object.keys(disbursementsPerStudent).length
      } student(s).`,
    );
    // Identify the distinct students to be processed in parallel.
    const uniqueStudentIds = Object.keys(disbursementsPerStudent);
    // Process students in parallel.
    await processInParallel(
      (uniqueStudentId: string) =>
        this.calculateDisbursementsForStudent(
          disbursementsPerStudent[uniqueStudentId],
          log,
        ),
      uniqueStudentIds,
    );
  }

  /**
   * Group all disbursements per student id.
   * @param eCertDisbursements disbursements to be grouped.
   * @returns grouped disbursements.
   */
  private getGroupedDisbursementsPerStudent(
    eCertDisbursements: EligibleECertDisbursement[],
  ): GroupedDisbursementPerStudent {
    return eCertDisbursements.reduce(
      (group: GroupedDisbursementPerStudent, disbursement) => {
        const studentId = disbursement.studentId;
        if (!group[studentId]) {
          group[studentId] = [];
        }
        group[studentId].push(disbursement);
        return group;
      },
      {},
    );
  }

  /**
   * Execute all the disbursements for a single student sequentially.
   * @param eCertDisbursements all disbursements for a single student.
   * @param parentLog cumulative process log.
   */
  private async calculateDisbursementsForStudent(
    eCertDisbursements: EligibleECertDisbursement[],
    parentLog: ProcessSummary,
  ): Promise<void> {
    const steps = this.calculationSteps();
    // Ensures that disbursements for the same student will be processed
    // sequentially since one disbursement may affect student account data like
    // overawards balance and maximums where a second disbursement should take
    // those updated data into consideration.
    for (const eCertDisbursement of eCertDisbursements) {
      const disbursementLog = new ProcessSummary();
      parentLog.children(disbursementLog);
      disbursementLog.info(
        `Processing application number ${eCertDisbursement.applicationNumber}, disbursement id ${eCertDisbursement.disbursement.id} scheduled for ${eCertDisbursement.disbursement.disbursementDate}.`,
      );
      try {
        await this.dataSource.transaction(async (entityManager) => {
          let stepNumber = 1;
          // Execute all steps sequentially. The order of execution is important since the
          // disbursement data is potentially changed along the steps till it is persisted.
          for (const step of steps) {
            disbursementLog.info(
              `Executing step ${stepNumber++} out of ${steps.length}.`,
            );
            const shouldProceed = await step.executeStep(
              eCertDisbursement,
              entityManager,
              disbursementLog,
            );
            if (!shouldProceed) {
              // Create notifications to the student and ministry when the disbursement is blocked.
              const notificationMessageId = 16;
              const notification = await entityManager
                .getRepository(Notification)
                .createQueryBuilder("notifications")
                .select("count(*)::int", "notificationsCount")
                .addSelect("max(notifications.created_at)", "max_created_at")
                .innerJoin(
                  "notifications.notificationMessage",
                  "notificationMessage",
                )
                .where("notificationMessage.id = :notificationMessageId", {
                  notificationMessageId,
                })
                .andWhere("notifications.permanent_failure_error IS NULL")
                .andWhere(
                  "notifications.metadata->>'disbursement_id' = :disbursementId",
                  {
                    disbursementId: eCertDisbursement.disbursement.id,
                  },
                )
                .getRawOne<NotificationData>();
              const sevenDaysLaterDate = getUTC(
                addDays(7, notification.max_created_at),
              );
              // Condition check to create notifications: Less than 3 notifications are created previously and there are no failures in sending those created notifications.
              // Plus, it has been atleast 7 days from the last created notification for this disbursement.
              if (
                !notification.notificationsCount ||
                (notification.notificationsCount < 3 &&
                  sevenDaysLaterDate < getUTCNow())
              ) {
                await this.createDisbursementBlockedNotifications(
                  eCertDisbursement.disbursement.id,
                  eCertDisbursement.studentId,
                  eCertDisbursement.applicationNumber,
                  entityManager,
                );
              }
              disbursementLog.info(
                "The step determined that the calculation should be interrupted. This disbursement will not be part of the next e-Cert generation.",
              );
              break;
            }
          }
        });
      } catch (error: unknown) {
        disbursementLog.error(
          "Unexpected error while processing disbursement. Student disbursements for this student will no longer be calculated.",
          parseJSONError(error),
        );
        // Stops further disbursements calculations for the same student.
        break;
      }
    }
  }

  /**
   * Creates disbursement blocked notifications for student and ministry.
   * @param disbursementId disbursement id associated with the blocked disbursement.
   * @param studentId student id associated with the blocked disbursement.
   * @param applicationNumber application number associated with the blocked disbursement.
   * @param entityManager entity manager to execute in transaction.
   */
  private async createDisbursementBlockedNotifications(
    disbursementId: number,
    studentId: number,
    applicationNumber: string,
    entityManager: EntityManager,
  ) {
    const student = await entityManager.getRepository(Student).findOne({
      select: {
        id: true,
        birthDate: true,
        user: { firstName: true, lastName: true, email: true },
      },
      relations: { user: true },
      where: { id: studentId },
    });
    const studentNotification: StudentNotification = {
      givenNames: student.user.firstName,
      lastName: student.user.lastName,
      toAddress: student.user.email,
      userId: student.user.id,
    };
    const ministryNotification: DisbursementBlockedNotificationForMinistry = {
      givenNames: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      dob: student.birthDate,
      applicationNumber: applicationNumber,
    };
    const disbursementBlockedNotificationForStudentPromise =
      this.notificationActionsService.saveDisbursementBlockedNotificationForStudent(
        studentNotification,
        disbursementId,
        entityManager,
      );
    const disbursementBlockedNotificationForMinistryPromise =
      this.notificationActionsService.saveDisbursementBlockedNotificationForMinistry(
        ministryNotification,
        disbursementId,
        entityManager,
      );
    await Promise.all([
      disbursementBlockedNotificationForStudentPromise,
      disbursementBlockedNotificationForMinistryPromise,
    ]);
  }
}
