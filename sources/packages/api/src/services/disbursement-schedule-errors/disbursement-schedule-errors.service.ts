import { Injectable, Inject } from "@nestjs/common";
import { Connection } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  DisbursementFeedbackErrors,
  DisbursementSchedule,
} from "../../database/entities";

/**
 * Service layer for Disbursement Schedule Errors
 * generated from E-Cert feedback file.
 */
@Injectable()
export class DisbursementScheduleErrorsService extends RecordDataModelService<DisbursementFeedbackErrors> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(DisbursementFeedbackErrors));
  }

  /**
   * Save Error codes from the E-Cert feedback file.
   * @param disbursementSchedule disbursementSchedule.
   * @param errorCode Error Code to be saved.
   * @param dateReceived Date Received.
   * @returns Created E-Cert Error record.
   */
  async createECertErrorRecord(
    disbursementSchedule: DisbursementSchedule,
    errorCode: string[],
    dateReceived: Date,
  ): Promise<DisbursementFeedbackErrors[]> {
    const errorCodesObject = errorCode.map((errorCode) => {
      const newDisbursementsFeedbackErrors = new DisbursementFeedbackErrors();
      newDisbursementsFeedbackErrors.disbursementSchedule =
        disbursementSchedule;
      newDisbursementsFeedbackErrors.errorCode = errorCode;
      newDisbursementsFeedbackErrors.dateReceived = dateReceived;
      return newDisbursementsFeedbackErrors;
    });
    return this.repo.save(errorCodesObject);
  }
}
