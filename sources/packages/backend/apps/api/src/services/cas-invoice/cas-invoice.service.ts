import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CASInvoice, CASInvoiceStatus, User } from "@sims/sims-db";
import { In, Repository, UpdateResult } from "typeorm";
import {
  CASInvoicePaginationOptionsAPIInDTO,
  PaginatedResults,
} from "../../utilities";

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
    paginationOptions: CASInvoicePaginationOptionsAPIInDTO,
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
        invoiceStatus: paginationOptions.invoiceStatusSearch?.length
          ? In(paginationOptions.invoiceStatusSearch)
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
   * Checks if CAS invoice exists.
   * @param invoiceId invoice id.
   * @returns true if invoice exists, false otherwise.
   */
  async checkCASInvoiceExists(invoiceId: number): Promise<boolean> {
    return this.repo.exists({
      where: {
        id: invoiceId,
        invoiceStatus: CASInvoiceStatus.ManualIntervention,
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
    return this.repo.update(
      { id: invoiceId },
      {
        invoiceStatus,
        invoiceStatusUpdatedBy: auditUser,
      },
    );
  }
}
