import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  DisbursementFeedbackErrors,
  DisbursementSchedule,
} from "../../database/entities";
import { DatabaseConstraintNames } from "../../database/error-handler";

/**
 * Service layer for Disbursement Schedule Errors
 * generated from E-Cert feedback file.
 */
@Injectable()
export class DisbursementScheduleErrorsService extends RecordDataModelService<DisbursementFeedbackErrors> {
  constructor(dataSource: DataSource) {
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
    const errorCodesObject = errorCodes.map((errorCode) => {
      const newDisbursementsFeedbackErrors = new DisbursementFeedbackErrors();
      newDisbursementsFeedbackErrors.disbursementSchedule =
        disbursementSchedule;
      newDisbursementsFeedbackErrors.errorCode = errorCode;
      newDisbursementsFeedbackErrors.dateReceived = dateReceived;
      return newDisbursementsFeedbackErrors;
    });
    return this.repo
      .createQueryBuilder()
      .insert()
      .into(DisbursementFeedbackErrors)
      .values(errorCodesObject)
      .onConflict(
        `ON CONSTRAINT ${DatabaseConstraintNames.DisbursementScheduleIDErrorCodeUnique} DO NOTHING`,
      )
      .execute();
  }
}
