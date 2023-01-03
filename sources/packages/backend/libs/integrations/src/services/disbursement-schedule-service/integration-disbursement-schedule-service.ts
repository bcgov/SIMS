import { Injectable } from "@nestjs/common";
import { RecordDataModelService, DisbursementSchedule } from "@sims/sims-db";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  /**
   * Get disbursement schedules by document numbers.
   * @param documentNumbers document numbers of disbursements.
   * @returns disbursement schedules.
   */
  async getDisbursementsByDocumentNumbers(
    documentNumbers: number[],
  ): Promise<DisbursementSchedule[]> {
    return this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.documentNumber",
      ])
      .where("disbursementSchedule.documentNumber IN (:...documentNumbers)", {
        documentNumbers,
      })
      .getMany();
  }
}
