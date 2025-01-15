import { Injectable } from "@nestjs/common";
import {
  DisbursementBlockedNotification,
  NotificationActionsService,
} from "@sims/services";
import { Notification, NotificationMessageType, Student } from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { ECertNotification } from "../e-cert-notification";
import { EligibleECertDisbursement } from "../../disbursement-schedule.models";

/**
 * Creates a notification for a blocked disbursement for the Ministry, if required.
 */
@Injectable()
export class MinistryBlockedDisbursementNotification extends ECertNotification {
  constructor(
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    super("Ministry Blocked Disbursement");
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
    const hasNotification = await entityManager
      .getRepository(Notification)
      .exists({
        where: {
          notificationMessage: {
            id: NotificationMessageType.MinistryNotificationDisbursementBlocked,
          },
          metadata: {
            disbursementId: eCertDisbursement.disbursement.id,
          },
        },
      });
    return !hasNotification;
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
        birthDate: true,
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
    const ministryNotification: DisbursementBlockedNotification = {
      givenNames: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      birthDate: student.birthDate,
      applicationNumber: eCertDisbursement.applicationNumber,
    };
    await this.notificationActionsService.saveDisbursementBlockedNotificationForMinistry(
      ministryNotification,
      eCertDisbursement.disbursement.id,
      entityManager,
    );
  }
}
