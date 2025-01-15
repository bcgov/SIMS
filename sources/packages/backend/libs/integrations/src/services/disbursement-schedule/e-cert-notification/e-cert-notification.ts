import { EntityManager } from "typeorm";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { ProcessSummary } from "@sims/utilities/logger";

/**
 * Provides a basic structure for creating and
 * sending notifications related to e-Cert disbursements.
 */
export abstract class ECertNotification {
  /**
   * Initializes a new instance of {@link ECertNotification}.
   * @param notificationName friendly name of the notification for logging
   */
  protected constructor(private readonly notificationName: string) {}

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
    await this.createNotification(eCertDisbursement, entityManager);
    notificationLog.info(
      `${this.notificationName} notification created for disbursement ID ${eCertDisbursement.disbursement.id}.`,
    );
    return true;
  }
}
