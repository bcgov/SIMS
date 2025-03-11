import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  CASInvoiceBatch,
  CASInvoiceBatchApprovalStatus,
  User,
} from "@sims/sims-db";
import { In, Repository } from "typeorm";
import {
  CASInvoiceBatchesPaginationOptions,
  PaginatedResults,
} from "../../utilities";
import { CustomNamedError } from "@sims/utilities";
import {
  CAS_INVOICE_BATCH_NOT_FOUND,
  CAS_INVOICE_BATCH_NOT_PENDING,
} from "../../constants";

@Injectable()
export class CASInvoiceBatchService {
  constructor(
    @InjectRepository(CASInvoiceBatch)
    private readonly casInvoiceBatchRepo: Repository<CASInvoiceBatch>,
  ) {}

  /**
   * Retrieve all CAS invoice batches.
   * @param paginationOptions pagination options.
   * @returns paginated CAS invoice batches results.
   */
  async getCASInvoiceBatches(
    paginationOptions: CASInvoiceBatchesPaginationOptions,
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
      where: {
        approvalStatus: paginationOptions.approvalStatusSearch?.length
          ? In(paginationOptions.approvalStatusSearch)
          : undefined,
      },
      skip: paginationOptions.pageLimit * paginationOptions.page,
      take: paginationOptions.pageLimit,
      order: {
        [paginationOptions.sortField]: paginationOptions.sortOrder,
      },
    });
    return { results, count };
  }

  /**
   * Update the approval status for a CAS invoice batch record.
   * @param casInvoiceBatchId ID of the CAS invoice batch to be updated.
   * @param approvalStatus approval status.
   * @param auditUserId user to update the record.
   */
  async updateCASInvoiceBatch(
    casInvoiceBatchId: number,
    approvalStatus: CASInvoiceBatchApprovalStatus,
    auditUserId: number,
  ): Promise<void> {
    const casInvoiceBatch = await this.getCASInvoiceBatchRecord(
      casInvoiceBatchId,
    );
    if (!casInvoiceBatch) {
      throw new CustomNamedError(
        `CAS invoice batch with ID ${casInvoiceBatchId} not found.`,
        CAS_INVOICE_BATCH_NOT_FOUND,
      );
    }
    if (
      casInvoiceBatch.approvalStatus !== CASInvoiceBatchApprovalStatus.Pending
    ) {
      throw new CustomNamedError(
        `Cannot update CAS invoice batch with ID ${casInvoiceBatchId} that is approved or rejected.`,
        CAS_INVOICE_BATCH_NOT_PENDING,
      );
    }
    const auditUser = { id: auditUserId } as User;
    await this.casInvoiceBatchRepo.update(
      { id: casInvoiceBatchId },
      {
        approvalStatus,
        approvalStatusUpdatedBy: auditUser,
        approvalStatusUpdatedOn: new Date(),
      },
    );
  }

  /**
   * Retrieve a CAS invoice batch record.
   * @param casInvoiceBatchId ID of the CAS invoice batch to be retrieved.
   * @returns the CAS invoice batch with all its invoices and related data.
   */
  private async getCASInvoiceBatchRecord(
    casInvoiceBatchId: number,
  ): Promise<CASInvoiceBatch> {
    return this.casInvoiceBatchRepo.findOne({
      select: {
        id: true,
        approvalStatus: true,
      },
      where: { id: casInvoiceBatchId },
    });
  }
}
