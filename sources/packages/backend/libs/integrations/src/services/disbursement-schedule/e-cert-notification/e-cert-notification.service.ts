import { Injectable } from "@nestjs/common";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { MinistryBlockedDisbursementNotification } from "./blocked-disbursement/ministry-blocked-disbursement-notification";
import { StudentBlockedDisbursementNotification } from "./blocked-disbursement/student-blocked-disbursement-notification";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";

@Injectable()
export class ECertNotificationService {
  constructor(
    private readonly ministryBlockedDisbursementNotification: MinistryBlockedDisbursementNotification,
    private readonly studentBlockedDisbursementNotification: StudentBlockedDisbursementNotification,
  ) {}

  /**
   * Checks and creates disbursement blocked notification(s).
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager entity manager to execute in transaction.
   * @param log cumulative log summary.
   */
  async notifyBlockedDisbursement(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<void> {
    const notifications = [
      this.ministryBlockedDisbursementNotification,
      this.studentBlockedDisbursementNotification,
    ].map((notification) =>
      notification.notify(eCertDisbursement, entityManager, log),
    );
    await Promise.all(notifications);
  }
}
