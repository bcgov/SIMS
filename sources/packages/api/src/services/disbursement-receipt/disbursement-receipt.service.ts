import { Injectable } from "@nestjs/common";
import { Connection, Repository } from "typeorm";
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

  async getDisbursementReceiptsByDisbursementScheduleId(
    disbursementScheduleIds: number[],
    externalRepo?: Repository<DisbursementReceipt>,
  ): Promise<DisbursementReceipt[]> {
    const repo = externalRepo ?? this.repo;
    return repo
      .createQueryBuilder("disbursementReceipt")
      .select([
        "disbursementReceipt.id",
        "disbursementReceipt.disbursementScheduleId",
      ])
      .where(
        "disbursementReceipt.disbursementScheduleId IN (:...disbursementScheduleIds)",
        {
          disbursementScheduleIds,
        },
      )
      .getMany();
  }
}
