import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, InsertResult } from "typeorm";
import {
  RecordDataModelService,
  DisbursementFeedbackErrors,
  ECertFeedbackError,
} from "@sims/sims-db";
import {
  ECertFeedbackFileErrorNotification,
  NotificationActionsService,
  SystemUsersService,
} from "@sims/services";
import { DisbursementScheduleService } from "../disbursement-schedule/disbursement-schedule.service";
import { CustomNamedError } from "@sims/utilities";
import { DOCUMENT_NUMBER_NOT_FOUND } from "@sims/integrations/constants";

/**
 * Service layer for Disbursement Schedule Errors
 * generated from E-Cert feedback file.
 */
@Injectable()
export class DisbursementScheduleErrorsService extends RecordDataModelService<DisbursementFeedbackErrors> {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly dataSource: DataSource,
  ) {
    super(dataSource.getRepository(DisbursementFeedbackErrors));
  }

  /**
   * Save Error codes from the E-Cert feedback file and
   * sends a ministry notification if at least one of the
   * error codes in the eCert feedback response
   * record for a disbursement blocks funding.
   * @param documentNumber disbursement document number.
   * @param feedbackFileName feedback integration file name.
   * @param errorCodeIds e-Cert feedback error ids
   * of error codes received.
   * @param dateReceived Date Received.
   * @param sendNotification boolean true if a notification has
   * to be sent for this eCert feedback response record. This
   * boolean will be true if the eCert feedback response record
   * has at least one error code that is blocking funding.
   * @returns Created E-Cert Error record.
   */
  async createECertErrorRecord(
    documentNumber: number,
    feedbackFileName: string,
    errorCodeIds: number[],
    dateReceived: Date,
    sendNotification: boolean,
  ): Promise<InsertResult> {
    const disbursementSchedule =
      await this.disbursementScheduleService.getDisbursementScheduleByDocumentNumber(
        documentNumber,
      );
    if (!disbursementSchedule) {
      throw new CustomNamedError(
        `Disbursement for document number ${documentNumber} not found.`,
        DOCUMENT_NUMBER_NOT_FOUND,
      );
    }
    const auditUser = this.systemUsersService.systemUser;
    const disbursementFeedbackErrors = errorCodeIds.map((errorCodeId) => {
      const disbursementFeedbackError = new DisbursementFeedbackErrors();
      disbursementFeedbackError.disbursementSchedule = disbursementSchedule;
      disbursementFeedbackError.eCertFeedbackError = {
        id: errorCodeId,
      } as ECertFeedbackError;
      disbursementFeedbackError.feedbackFileName = feedbackFileName;
      disbursementFeedbackError.dateReceived = dateReceived;
      disbursementFeedbackError.creator = auditUser;
      return disbursementFeedbackError;
    });
    const user =
      disbursementSchedule.studentAssessment.application.student.user;
    const ministryNotification: ECertFeedbackFileErrorNotification = {
      givenNames: user.firstName,
      lastName: user.lastName,
    };
    return this.dataSource.transaction(
      async (transactionalEntityManager: EntityManager) => {
        sendNotification
          ? await this.notificationActionsService.saveEcertFeedbackFileErrorNotification(
              ministryNotification,
              transactionalEntityManager,
            )
          : null;
        return transactionalEntityManager
          .getRepository(DisbursementFeedbackErrors)
          .createQueryBuilder()
          .insert()
          .into(DisbursementFeedbackErrors)
          .values(disbursementFeedbackErrors)
          .orIgnore()
          .execute();
      },
    );
  }
}
