import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CASInvoice, CASInvoiceStatus, User } from "@sims/sims-db";
import { Repository, UpdateResult } from "typeorm";
import { CASInvoicePaginationOptions, PaginatedResults } from "../../utilities";

@Injectable()
export class CASInvoiceService {
  constructor(
    @InjectRepository(CASInvoice)
    private readonly repo: Repository<CASInvoice>,
  ) {}

  /**
   * Retrieve all CAS invoices.
   * @param paginationOptions pagination options.
   * @returns paginated CAS invoices.
   */
  async getCASInvoices(
    paginationOptions: CASInvoicePaginationOptions,
  ): Promise<PaginatedResults<CASInvoice>> {
    const [results, count] = await this.repo.findAndCount({
      select: {
        id: true,
        invoiceStatusUpdatedOn: true,
        invoiceNumber: true,
        casInvoiceBatch: {
          id: true,
          batchName: true,
        },
        casSupplier: {
          id: true,
          supplierNumber: true,
        },
        errors: true,
      },
      relations: {
        casSupplier: true,
        casInvoiceBatch: true,
      },
      where: {
        invoiceStatus: paginationOptions.invoiceStatusSearch,
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
   * Checks if CAS invoice exists.
   * @param invoiceId invoice id.
   * @param options provided options
   * `invoiceStatus`: invoice status.
   * @returns true if invoice exists, false otherwise.
   */
  async checkCASInvoiceExists(
    invoiceId: number,
    options?: { invoiceStatus: CASInvoiceStatus },
  ): Promise<boolean> {
    return this.repo.exists({
      where: {
        id: invoiceId,
        invoiceStatus: options?.invoiceStatus,
      },
    });
  }

  /**
   * Update CAS invoice status.
   * @param invoiceId invoice id for which status has to be updated.
   * @param invoiceStatus invoice status to update to.
   * @param auditUserId audit user id.
   * @returns update result.
   */
  async updateCASInvoiceStatus(
    invoiceId: number,
    invoiceStatus: CASInvoiceStatus,
    auditUserId: number,
  ): Promise<UpdateResult> {
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    return this.repo.update(
      { id: invoiceId },
      {
        invoiceStatus,
        invoiceStatusUpdatedOn: now,
        invoiceStatusUpdatedBy: auditUser,
        modifier: auditUser,
        updatedAt: now,
      },
    );
  }
}
