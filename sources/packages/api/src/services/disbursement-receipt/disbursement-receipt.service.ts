import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import { DisbursementReceipt } from "../../database/entities";

/**
 * Service for disbursement receipts.
 */
@Injectable()
export class DisbursementReceiptService extends RecordDataModelService<DisbursementReceipt> {
  constructor(private readonly connection: Connection) {
    super(connection.getRepository(DisbursementReceipt));
  }

  /**
   * Insert disbursement receipt record.
   ** On insertion ignore duplicate records(identified by constraint disbursement_schedule_id_funding_type_unique).
   * @param disbursementReceipt
   */
  async insertDisbursementReceipt(
    disbursementReceipt: DisbursementReceipt,
  ): Promise<void> {
    await this.connection.transaction(async (transactionalEntityManager) => {
      //Query builder inserts does not cascade insert with relationships.
      //Cascaded insert can be achieved only through repository.save().
      //Hence inside a transaction we are using save to persist relations.

      const result = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(DisbursementReceipt)
        .values(disbursementReceipt)
        .orIgnore(
          "ON CONSTRAINT disbursement_schedule_id_funding_type_unique DO NOTHING",
        )
        .execute();
      if (
        result.identifiers[0] &&
        disbursementReceipt.disbursementReceiptValues?.length > 0
      ) {
        await transactionalEntityManager
          .getRepository(DisbursementReceipt)
          .save({
            id: result.identifiers[0].id,
            disbursementReceiptValues:
              disbursementReceipt.disbursementReceiptValues,
          });
      }
    });
  }
}
