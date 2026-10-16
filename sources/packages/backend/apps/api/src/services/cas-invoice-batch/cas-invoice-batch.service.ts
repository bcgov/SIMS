import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  CASInvoiceBatch,
  CASInvoiceBatchApprovalStatus,
  CASInvoiceStatus,
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
import {
  CASInvoiceBatchAwardAmount,
  CASInvoiceBatchProcessingSummary,
} from "./cas-invoice-batch.models";

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
    const casInvoiceBatch =
      await this.getCASInvoiceBatchRecord(casInvoiceBatchId);
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
   * Checks if CAS invoice batch exists.
   * @param casInvoiceBatchId ID of the CAS invoice batch.
   * @returns true if the CAS invoice batch exists, false otherwise.
   */
  async checkCASInvoiceBatchExists(
    casInvoiceBatchId: number,
  ): Promise<boolean> {
    return this.casInvoiceBatchRepo.exists({
      where: { id: casInvoiceBatchId },
    });
  }

  /**
   * Retrieve the total amounts of a CAS invoice batch for each
   * distribution account type (award code, offering intensity and operation code).
   * @param casInvoiceBatchId ID of the CAS invoice batch.
   * @returns total amounts for each distribution account type.
   */
  async getCASInvoiceBatchDistributionTotals(
    casInvoiceBatchId: number,
  ): Promise<CASInvoiceBatchAwardAmount[]> {
    const distributionTotals = await this.casInvoiceBatchRepo
      .createQueryBuilder("casInvoiceBatch")
      .select("casDistributionAccount.awardValueCode", "awardValueCode")
      .addSelect(
        "casDistributionAccount.offeringIntensity",
        "offeringIntensity",
      )
      .addSelect("casDistributionAccount.operationCode", "operationCode")
      .addSelect("SUM(casInvoiceDetail.valueAmount)", "total")
      .innerJoin("casInvoiceBatch.casInvoices", "casInvoice")
      .innerJoin("casInvoice.casInvoiceDetails", "casInvoiceDetail")
      .innerJoin(
        "casInvoiceDetail.casDistributionAccount",
        "casDistributionAccount",
      )
      .where("casInvoiceBatch.id = :casInvoiceBatchId", { casInvoiceBatchId })
      .groupBy("casDistributionAccount.awardValueCode")
      .addGroupBy("casDistributionAccount.offeringIntensity")
      .addGroupBy("casDistributionAccount.operationCode")
      .orderBy("casDistributionAccount.awardValueCode")
      .addOrderBy("casDistributionAccount.offeringIntensity")
      .addOrderBy("casDistributionAccount.operationCode")
      .getRawMany<
        Omit<CASInvoiceBatchAwardAmount, "total"> & {
          total: string;
        }
      >();
    // The total is returned from DB as string, needs to be converted to a number,
    // since valueAmount is defined as numeric in the DB.
    return distributionTotals.map((distributionTotal) => ({
      ...distributionTotal,
      total: +distributionTotal.total,
    }));
  }

  /**
   * Retrieve the count of invoices of a CAS invoice batch for each invoice status.
   * @param casInvoiceBatchId ID of the CAS invoice batch.
   * @returns count of invoices for each invoice status.
   */
  async getCASInvoiceBatchProcessingSummary(
    casInvoiceBatchId: number,
  ): Promise<CASInvoiceBatchProcessingSummary> {
    return this.casInvoiceBatchRepo
      .createQueryBuilder("casInvoiceBatch")
      .select("COUNT(casInvoice.id)::int", "totalInvoices")
      .addSelect(
        "COUNT(casInvoice.id) FILTER (WHERE casInvoice.invoiceStatus = :pendingStatus)::int",
        "totalPending",
      )
      .addSelect(
        "COUNT(casInvoice.id) FILTER (WHERE casInvoice.invoiceStatus = :sentStatus)::int",
        "totalSent",
      )
      .addSelect(
        "COUNT(casInvoice.id) FILTER (WHERE casInvoice.invoiceStatus = :manualInterventionStatus)::int",
        "totalManualIntervention",
      )
      .addSelect(
        "COUNT(casInvoice.id) FILTER (WHERE casInvoice.invoiceStatus = :resolvedStatus)::int",
        "totalResolved",
      )
      .leftJoin("casInvoiceBatch.casInvoices", "casInvoice")
      .where("casInvoiceBatch.id = :casInvoiceBatchId", { casInvoiceBatchId })
      .setParameters({
        pendingStatus: CASInvoiceStatus.Pending,
        sentStatus: CASInvoiceStatus.Sent,
        manualInterventionStatus: CASInvoiceStatus.ManualIntervention,
        resolvedStatus: CASInvoiceStatus.Resolved,
      })
      .getRawOne<CASInvoiceBatchProcessingSummary>();
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
