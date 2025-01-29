import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CASInvoiceBatch } from "@sims/sims-db";
import { Repository } from "typeorm";

@Injectable()
export class CASInvoiceBatchService {
  constructor(
    @InjectRepository(CASInvoiceBatch)
    private readonly casInvoiceBatchRepo: Repository<CASInvoiceBatch>,
  ) {}

  /**
   * Retrieve all CAS invoice batches.
   * @returns list of CAS invoice batches ordered by batch date in descending order.
   */
  async getCASInvoiceBatches(): Promise<CASInvoiceBatch[]> {
    return this.casInvoiceBatchRepo.find({
      select: {
        id: true,
        batchName: true,
        batchDate: true,
        approvalStatus: true,
        approvalStatusUpdatedOn: true,
        approvalStatusUpdatedBy: { id: true, firstName: true, lastName: true },
      },
      relations: {
        approvalStatusUpdatedBy: true,
      },
      order: {
        batchDate: "DESC",
      },
    });
  }
}
