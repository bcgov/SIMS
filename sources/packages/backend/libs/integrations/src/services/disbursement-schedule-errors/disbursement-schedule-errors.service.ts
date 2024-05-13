import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult } from "typeorm";
import {
  RecordDataModelService,
  DisbursementFeedbackErrors,
  ECertFeedbackError,
} from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";
import { DisbursementScheduleService } from "../disbursement-schedule/disbursement-schedule.service";
import { CustomNamedError } from "@sims/utilities";
import { DOCUMENT_NUMBER_NOT_FOUND } from "@sims/services/constants";

/**
 * Service layer for Disbursement Schedule Errors
 * generated from E-Cert feedback file.
 */
@Injectable()
export class DisbursementScheduleErrorsService extends RecordDataModelService<DisbursementFeedbackErrors> {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    dataSource: DataSource,
  ) {
    super(dataSource.getRepository(DisbursementFeedbackErrors));
  }

  /**
   * Save Error codes from the E-Cert feedback file.
   * @param documentNumber disbursement document number.
   * @param errorCodeIds e-Cert feedback error ids
   * of error codes received.
   * @param dateReceived Date Received.
   * @returns Created E-Cert Error record.
   */
  async createECertErrorRecord(
    documentNumber: number,
    errorCodeIds: number[],
    dateReceived: Date,
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
      disbursementFeedbackError.dateReceived = dateReceived;
      disbursementFeedbackError.creator = auditUser;
      return disbursementFeedbackError;
    });
    return this.repo
      .createQueryBuilder()
      .insert()
      .into(DisbursementFeedbackErrors)
      .values(disbursementFeedbackErrors)
      .orIgnore()
      .execute();
  }
}
