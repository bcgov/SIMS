import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BC_TOTAL_GRANT_AWARD_CODE } from "@sims/services/constants";
import {
  CASDistributionAccount,
  CASInvoice,
  CASInvoiceBatch,
  CASInvoiceBatchApprovalStatus,
  CASInvoiceDetail,
  CASInvoiceStatus,
  DisbursementReceipt,
  DisbursementValueType,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { DataSource, Repository } from "typeorm";
import * as dayjs from "dayjs";
import { SequenceControlService, SystemUsersService } from "@sims/services";
import { ProcessSummary } from "@sims/utilities/logger";

Injectable();
export class CASInvoiceBatchService {
  constructor(
    @InjectRepository(CASDistributionAccount)
    private readonly casDistributionAccountRepo: Repository<CASDistributionAccount>,
    @InjectRepository(CASInvoiceBatch)
    private readonly casInvoiceBatchRepo: Repository<CASInvoiceBatch>,
    @InjectRepository(CASInvoice)
    private readonly casInvoiceRepo: Repository<CASInvoice>,
    @InjectRepository(DisbursementReceipt)
    private readonly disbursementReceiptRepo: Repository<DisbursementReceipt>,
    private readonly sequenceControlService: SequenceControlService,
    private readonly systemUsersService: SystemUsersService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   *
   * @param processSummary process summary for logging.
   * @returns
   */
  async createInvoiceBatch(
    processSummary: ProcessSummary,
  ): Promise<CASInvoiceBatch> {
    return this.dataSource.transaction(async (entityManager) => {
      let newBatchUniqueSequence: number;
      // Consumes the next sequence number and prevent concurrent access.
      await this.sequenceControlService.consumeNextSequenceWithExistingEntityManager(
        "CAS_INVOICE_BATCH",
        entityManager,
        async (nextSequenceNumber: number) => {
          newBatchUniqueSequence = nextSequenceNumber;
        },
      );
      processSummary.info("Checking for pending receipts.");
      const pendingReceipts = await this.getPendingReceiptsForInvoiceBatch();
      if (!pendingReceipts.length) {
        processSummary.info("No pending receipts found.");
        // Cancels the transaction to rollback the batch number.
        entityManager.queryRunner.rollbackTransaction();
        return null;
      }
      processSummary.info(`Found ${pendingReceipts.length} pending receipts.`);
      const now = new Date();
      // Create the new invoice batch.
      const invoiceBatch = new CASInvoiceBatch();
      invoiceBatch.batchName = `SIMS-BATCH-${newBatchUniqueSequence}`;
      invoiceBatch.batchDate = getISODateOnlyString(now);
      invoiceBatch.approvalStatus = CASInvoiceBatchApprovalStatus.Pending;
      invoiceBatch.approvalStatusUpdatedOn = now;
      invoiceBatch.approvalStatusUpdatedBy = this.systemUsersService.systemUser;
      invoiceBatch.creator = this.systemUsersService.systemUser;
      await entityManager
        .getRepository(CASInvoiceBatch)
        .save(invoiceBatch, { chunk: 2 });
      // Accumulates the invoices to be saved.
      const casInvoices: CASInvoice[] = [];
      // Get distribution accounts to be associated with each invoice detail.
      const distributionAccounts = await this.getActiveDistributionAccounts();
      await this.sequenceControlService.consumeNextSequenceWithExistingEntityManager(
        "CAS_INVOICE",
        entityManager,
        async (nextSequenceNumber: number) => {
          let newInvoiceSequence = nextSequenceNumber;
          // Start processing the invoices for each pending receipt.
          for (const receipt of pendingReceipts) {
            const student =
              receipt.disbursementSchedule.studentAssessment.application
                .student;
            // New invoice creation.
            const invoice = new CASInvoice();
            invoice.casInvoiceBatch = invoiceBatch;
            invoice.disbursementReceipt = receipt;
            invoice.casSupplier = student.casSupplier;
            invoice.invoiceNumber = `SIMS-INVOICE-${newInvoiceSequence++}-${
              student.casSupplier.supplierNumber
            }`;
            invoice.invoiceStatus = CASInvoiceStatus.Pending;
            invoice.invoiceStatusUpdatedOn = now;
            invoice.creator = this.systemUsersService.systemUser;
            // Add the invoice to the invoice batch to be returned.
            casInvoices.push(invoice);
            const casInvoiceDetails: CASInvoiceDetail[] = [];
            const disbursedAwards =
              receipt.disbursementSchedule.disbursementValues;
            for (const disbursedAward of disbursedAwards) {
              // TODO: Add offering intensity.
              const accounts = distributionAccounts.filter(
                (account) =>
                  account.awardValueCode === disbursedAward.valueCode,
              );
              const awardInvoiceDetails = accounts.map((account) => {
                const invoiceDetail = new CASInvoiceDetail();
                invoiceDetail.casInvoice = invoice;
                invoiceDetail.casDistributionAccount = account;
                invoiceDetail.valueAmount = disbursedAward.effectiveAmount;
                invoiceDetail.creator = this.systemUsersService.systemUser;
                return invoiceDetail;
              });
              casInvoiceDetails.push(...awardInvoiceDetails);
            }
            invoice.casInvoiceDetails = casInvoiceDetails;
          }
          return newInvoiceSequence;
        },
      );
      console.time("Creating CAS invoice batch");
      await entityManager.getRepository(CASInvoice).save(casInvoices, {
        chunk: 100,
      });
      console.timeEnd("Creating CAS invoice batch");
      invoiceBatch.casInvoices = casInvoices;
      return invoiceBatch;
    });
  }

  private async getActiveDistributionAccounts(): Promise<
    CASDistributionAccount[]
  > {
    return this.casDistributionAccountRepo.find({
      select: { id: true, awardValueCode: true },
      where: { isActive: true },
    });
  }

  private async getPendingReceiptsForInvoiceBatch(): Promise<
    DisbursementReceipt[]
  > {
    const existsInvoice = this.casInvoiceRepo
      .createQueryBuilder("casInvoice")
      .select("1")
      .where("casInvoice.disbursementReceipt.id = disbursementReceipt.id")
      .getSql();
    return this.disbursementReceiptRepo
      .createQueryBuilder("disbursementReceipt")
      .select([
        "disbursementReceipt.id",
        "disbursementSchedule.id",
        "studentAssessment.id",
        "application.id",
        "student.id",
        "casSupplier.id",
        "casSupplier.supplierNumber",
        "disbursementValue.id",
        "disbursementValue.valueCode",
        "disbursementValue.effectiveAmount",
      ])
      .innerJoin(
        "disbursementReceipt.disbursementReceiptValues",
        "disbursementReceiptValue",
      )
      .innerJoin(
        "disbursementReceipt.disbursementSchedule",
        "disbursementSchedule",
      )
      .innerJoin("disbursementSchedule.disbursementValues", "disbursementValue")
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("student.casSupplier", "casSupplier")
      .where("disbursementReceiptValue.grantType = :grantType", {
        grantType: BC_TOTAL_GRANT_AWARD_CODE,
      })
      .andWhere("disbursementReceiptValue.grantAmount > 0")
      .andWhere("disbursementValue.valueType = :valueType", {
        valueType: DisbursementValueType.BCGrant,
      })
      .andWhere("disbursementValue.effectiveAmount > 0")
      .andWhere("casSupplier.isValid = true")
      .andWhere(`NOT EXISTS (${existsInvoice})`)
      .getMany();
  }
}
