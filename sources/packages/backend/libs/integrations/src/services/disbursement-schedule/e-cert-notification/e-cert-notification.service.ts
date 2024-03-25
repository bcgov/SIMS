import { Injectable } from "@nestjs/common";
import {
  DisbursementBlockedNotificationForMinistry,
  NotificationActionsService,
  StudentNotification,
} from "@sims/services";
import {
  BLOCKED_DISBURSEMENT_MAXIMUM_NOTIFICATIONS_TO_SEND,
  BLOCKED_DISBURSEMENT_NOTIFICATION_MIN_DAYS_INTERVAL,
} from "@sims/services/constants";
import {
  DisbursementSchedule,
  Notification,
  NotificationMessageType,
} from "@sims/sims-db";
import { dateDifference } from "@sims/utilities";
import { EntityManager } from "typeorm";

interface NotificationData {
  maxCreatedAt: Date;
  notificationCount: number;
}

@Injectable()
export class ECertNotificationService {
  constructor(
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Checks and creates disbursement blocked notification.
   * @param disbursementId disbursement id.
   * @param entityManager entity manager to execute in transaction.
   */
  async createDisbursementBlockedNotification(
    disbursementId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const shouldCreateNotification =
      await this.shouldCreateDisbursementBlockedNotification(
        disbursementId,
        entityManager,
      );
    if (shouldCreateNotification) {
      await this.createDisbursementBlockedNotifications(
        disbursementId,
        entityManager,
      );
    }
  }

  /**
   * Checks whether the disbursement blocked notification should be created or not.
   * @param disbursementId disbursement id.
   * @param entityManager entity manager to execute in transaction.
   * @returns boolean indicating if the disbursement blocked notification should be created or not.
   */
  private async shouldCreateDisbursementBlockedNotification(
    disbursementId: number,
    entityManager: EntityManager,
  ): Promise<boolean> {
    const notification = await entityManager
      .getRepository(Notification)
      .createQueryBuilder("notification")
      .select("count(*)::int", "notificationCount")
      .addSelect("max(notification.createdAt)", "maxCreatedAt")
      .innerJoin("notification.notificationMessage", "notificationMessage")
      .where("notificationMessage.id = :notificationMessageId", {
        notificationMessageId:
          NotificationMessageType.StudentNotificationDisbursementBlocked,
      })
      .andWhere("notification.metadata->>'disbursementId' = :disbursementId", {
        disbursementId,
      })
      .getRawOne<NotificationData>();
    const canSendNewNotification =
      dateDifference(new Date(), notification.maxCreatedAt) >=
      BLOCKED_DISBURSEMENT_NOTIFICATION_MIN_DAYS_INTERVAL;
    // Condition check to create notifications: Less than BLOCKED_DISBURSEMENT_MAXIMUM_NOTIFICATIONS_TO_SEND notifications are created previously and there are no failures in sending those created notifications.
    // Plus, it has been at least BLOCKED_DISBURSEMENT_NOTIFICATION_MIN_DAYS_INTERVAL days from the last created notification for this disbursement.
    return (
      !notification.notificationCount ||
      (notification.notificationCount <
        BLOCKED_DISBURSEMENT_MAXIMUM_NOTIFICATIONS_TO_SEND &&
        canSendNewNotification)
    );
  }

  /**
   * Creates disbursement blocked notifications for student and ministry.
   * @param disbursementId disbursement id associated with the blocked disbursement.
   * @param entityManager entity manager to execute in transaction.
   */
  private async createDisbursementBlockedNotifications(
    disbursementId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const disbursement = await entityManager
      .getRepository(DisbursementSchedule)
      .findOne({
        select: {
          studentAssessment: {
            id: true,
            application: {
              id: true,
              applicationNumber: true,
              student: {
                id: true,
                birthDate: true,
                user: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        relations: {
          studentAssessment: { application: { student: { user: true } } },
        },
        where: { id: disbursementId },
      });
    const student = disbursement.studentAssessment.application.student;
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
      applicationNumber:
        disbursement.studentAssessment.application.applicationNumber,
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
