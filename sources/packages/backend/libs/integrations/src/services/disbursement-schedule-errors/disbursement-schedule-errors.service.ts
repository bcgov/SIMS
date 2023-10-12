import { Injectable } from "@nestjs/common";
import { DataSource, In, InsertResult } from "typeorm";
import {
  RecordDataModelService,
  DisbursementFeedbackErrors,
  DisbursementSchedule,
} from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";
import { FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS } from "../disbursement-schedule/disbursement-schedule.models";

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
    const auditUser = await this.systemUsersService.systemUser();
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

  /**
   * Checks if there is any full-time disbursement feedback errors.
   * @param disbursementScheduleId disbursement schedule id.
   * @returns true, if there is any full-time disbursement feedback
   * errors.
   */
  async hasFullTimeDisbursementFeedbackErrors(
    disbursementScheduleId: number,
  ): Promise<boolean> {
    return this.repo.exist({
      where: {
        disbursementSchedule: {
          id: disbursementScheduleId,
        },
        errorCode: In(FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS),
      },
    });
  }
}
