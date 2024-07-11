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
   * @param blockFundingErrorIds e-Cert feedback error ids
   * of error codes received that block funding and as a result
   * cause a notification to be sent out to the ministry.
   * @returns Created E-Cert Error record.
   */
  async createECertErrorRecord(
    documentNumber: number,
    feedbackFileName: string,
    errorCodeIds: number[],
    dateReceived: Date,
    blockFundingErrorIds: string[],
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
      applicationNumber:
        disbursementSchedule.studentAssessment.application.applicationNumber,
      errorCodes: blockFundingErrorIds,
    };
    return this.dataSource.transaction(
      async (transactionalEntityManager: EntityManager) => {
        if (blockFundingErrorIds.length) {
          await this.notificationActionsService.saveEcertFeedbackFileErrorNotification(
            ministryNotification,
            transactionalEntityManager,
          );
        }
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
