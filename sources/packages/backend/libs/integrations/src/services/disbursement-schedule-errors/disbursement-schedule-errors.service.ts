import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult } from "typeorm";
import {
  RecordDataModelService,
  DisbursementFeedbackErrors,
  DisbursementSchedule,
} from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";

/**
 * Service layer for Disbursement Schedule Errors
 * generated from E-Cert feedback file.
 */
@Injectable()
export class DisbursementScheduleErrorsService extends RecordDataModelService<DisbursementFeedbackErrors> {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    dataSource: DataSource,
  ) {
    super(dataSource.getRepository(DisbursementFeedbackErrors));
  }

  /**
   * Save Error codes from the E-Cert feedback file.
   * @param disbursementSchedule disbursementSchedule.
   * @param errorCodes Error Code to be saved.
   * @param dateReceived Date Received.
   * @returns Created E-Cert Error record.
   */
  async createECertErrorRecord(
    disbursementSchedule: DisbursementSchedule,
    errorCodes: string[],
    dateReceived: Date,
  ): Promise<InsertResult> {
    const auditUser = this.systemUsersService.systemUser;
    const errorCodesObject = errorCodes.map((errorCode) => {
      const newDisbursementsFeedbackErrors = new DisbursementFeedbackErrors();
      newDisbursementsFeedbackErrors.disbursementSchedule =
        disbursementSchedule;
      newDisbursementsFeedbackErrors.errorCode = errorCode;
      newDisbursementsFeedbackErrors.dateReceived = dateReceived;
      newDisbursementsFeedbackErrors.creator = auditUser;
      return newDisbursementsFeedbackErrors;
    });
    return this.repo
      .createQueryBuilder()
      .insert()
      .into(DisbursementFeedbackErrors)
      .values(errorCodesObject)
      .orIgnore()
      .execute();
  }
}
