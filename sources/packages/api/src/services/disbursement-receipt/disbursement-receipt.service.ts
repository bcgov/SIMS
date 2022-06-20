import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import { DisbursementReceipt } from "../../database/entities";

/**
 * Service for disbursement receipts.
 */
@Injectable()
export class DisbursementReceiptService extends RecordDataModelService<DisbursementReceipt> {
  constructor(connection: Connection) {
    super(connection.getRepository(DisbursementReceipt));
  }

  async insertDisbursementReceipt(
    disbursementReceipt: DisbursementReceipt,
  ): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(DisbursementReceipt)
      .values(disbursementReceipt)
      .orIgnore(
        "ON CONSTRAINT disbursement_schedule_id_funding_type_unique DO NOTHING",
      )
      .execute();
  }
}
