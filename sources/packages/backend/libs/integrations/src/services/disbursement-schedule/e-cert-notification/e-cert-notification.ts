import { EntityManager } from "typeorm";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { ProcessSummary } from "@sims/utilities/logger";
import { Notification, NotificationMessageType } from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { NOTIFICATION_MISSING_EMAIL_CONTACTS } from "@sims/services/constants";

/**
 * Provides a basic structure for creating and
 * sending notifications related to e-Cert disbursements.
 */
export abstract class ECertNotification {
  /**
   * Initializes a new instance of {@link ECertNotification}.
   * @param notificationName friendly name of the notification for logging
   * @param notificationMessageType type of the notification message.
   */
  protected constructor(
    private readonly notificationName: string,
    protected readonly notificationMessageType: NotificationMessageType,
  ) {}

  /**
   * Determines whether a notification should be created or not.
   * This method must be implemented by derived classes.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager entity manager to execute in transaction.
   * @returns true if a notification should be created, false otherwise.
   */
  protected abstract shouldCreateNotification(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
  ): Promise<boolean> | boolean;

  /**
   * Creates a notification for the given e-Cert disbursement.
   * This method must be implemented by derived classes.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager entity manager to execute in transaction.
   */
  protected abstract createNotification(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
  ): Promise<void>;

  /**
   * Get existing notification of the specified type for the given e-Cert disbursement.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager entity manager to execute in transaction.
   * @returns true if the notification exists, false otherwise.
   */
  protected async getExistingDisbursementNotification(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
  ): Promise<boolean> {
    return entityManager.getRepository(Notification).exists({
      where: {
        notificationMessage: {
          id: this.notificationMessageType,
        },
        metadata: {
          disbursementId: eCertDisbursement.disbursement.id,
        },
      },
    });
  }

  /**
   * Creates a notification defined by {@link createNotification} if the requirements
   * defined by {@link shouldCreateNotification} are met.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager entity manager to execute in transaction.
   * @param log cumulative log summary.
   * @returns true if the notification is created, false otherwise.
   */
  async notify(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    const notificationLog = new ProcessSummary();
    log.children(notificationLog);
    const shouldCreateNotification = await this.shouldCreateNotification(
      eCertDisbursement,
      entityManager,
    );
    if (!shouldCreateNotification) {
      notificationLog.info(
        `${this.notificationName} notification should not be created at this moment for disbursement ID ${eCertDisbursement.disbursement.id}.`,
      );
      return false;
    }
    try {
      await this.createNotification(eCertDisbursement, entityManager);
    } catch (error: unknown) {
      // Log process summary warning to create alerts when email contacts are missing for the notification
      // without failing the entire process.
      if (
        error instanceof CustomNamedError &&
        error.name === NOTIFICATION_MISSING_EMAIL_CONTACTS
      ) {
        notificationLog.warn(
          `${this.notificationName} notification cannot be created: ${error.message}`,
        );
        return false;
      }
      throw error;
    }
    notificationLog.info(
      `${this.notificationName} notification created for disbursement ID ${eCertDisbursement.disbursement.id}.`,
    );
    return true;
  }
}
