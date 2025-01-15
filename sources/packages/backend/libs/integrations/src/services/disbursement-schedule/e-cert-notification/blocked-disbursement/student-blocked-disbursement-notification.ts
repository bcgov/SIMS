import { Injectable } from "@nestjs/common";
import {
  NotificationActionsService,
  StudentNotification,
} from "@sims/services";
import {
  BLOCKED_DISBURSEMENT_MAXIMUM_NOTIFICATIONS_TO_SEND,
  BLOCKED_DISBURSEMENT_NOTIFICATION_MIN_DAYS_INTERVAL,
} from "@sims/services/constants";
import { Notification, NotificationMessageType, Student } from "@sims/sims-db";
import { dateDifference } from "@sims/utilities";
import { EntityManager } from "typeorm";
import { ECertNotification } from "../e-cert-notification";
import { EligibleECertDisbursement } from "../../disbursement-schedule.models";

interface NotificationData {
  maxCreatedAt: Date;
  notificationCount: number;
}

/**
 * Creates a notification for a blocked disbursement for the Student, if required.
 */
@Injectable()
export class StudentBlockedDisbursementNotification extends ECertNotification {
  constructor(
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    super("Student Blocked Disbursement");
  }

  /**
   * Determines whether a notification should be created or not.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager entity manager to execute in transaction.
   * @returns true if a notification should be created, false otherwise.
   */
  protected async shouldCreateNotification(
    eCertDisbursement: EligibleECertDisbursement,
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
        disbursementId: eCertDisbursement.disbursement.id,
      })
      .getRawOne<NotificationData>();
    const canSendNewNotification =
      dateDifference(new Date(), notification.maxCreatedAt) >
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
   * Creates a notification for the given e-Cert disbursement.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager entity manager to execute in transaction.
   */
  protected async createNotification(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
  ): Promise<void> {
    const student = await entityManager.getRepository(Student).findOne({
      select: {
        id: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      relations: {
        user: true,
      },
      where: { id: eCertDisbursement.studentId },
    });
    const studentNotification: StudentNotification = {
      givenNames: student.user.firstName,
      lastName: student.user.lastName,
      toAddress: student.user.email,
      userId: student.user.id,
    };
    await this.notificationActionsService.saveDisbursementBlockedNotificationForStudent(
      studentNotification,
      eCertDisbursement.disbursement.id,
      entityManager,
    );
  }
}
