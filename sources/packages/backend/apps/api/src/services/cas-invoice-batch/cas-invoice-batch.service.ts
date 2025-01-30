import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CASInvoiceBatch } from "@sims/sims-db";
import { Repository } from "typeorm";
import { PaginatedResults, PaginationOptions } from "../../utilities";

@Injectable()
export class CASInvoiceBatchService {
  constructor(
    @InjectRepository(CASInvoiceBatch)
    private readonly casInvoiceBatchRepo: Repository<CASInvoiceBatch>,
  ) {}

  /**
   * Retrieve all CAS invoice batches.
   * @param paginationOptions pagination options.
   * @returns list of CAS invoice batches ordered by batch date in descending order.
   */
  async getCASInvoiceBatches(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<CASInvoiceBatch>> {
    const [results, count] = await this.casInvoiceBatchRepo.findAndCount({
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
      skip: paginationOptions.pageLimit * paginationOptions.page,
      take: paginationOptions.pageLimit,
      order: {
        [paginationOptions.sortField]: paginationOptions.sortOrder,
      },
    });
    return { results, count };
  }
}
