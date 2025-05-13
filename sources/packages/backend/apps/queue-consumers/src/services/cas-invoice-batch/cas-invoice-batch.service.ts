import { Injectable } from "@nestjs/common";
import {
  BC_TOTAL_GRANT_AWARD_CODE,
  DATABASE_TRANSACTION_CANCELLATION,
} from "@sims/services/constants";
import {
  CASDistributionAccount,
  CASInvoice,
  CASInvoiceBatch,
  CASInvoiceBatchApprovalStatus,
  CASInvoiceDetail,
  CASInvoiceStatus,
  DisbursementReceipt,
  DisbursementValue,
  DisbursementValueType,
  RECEIPT_FUNDING_TYPE_FEDERAL,
} from "@sims/sims-db";
import { DataSource, EntityManager } from "typeorm";
import { SequenceControlService, SystemUsersService } from "@sims/services";
import { ProcessSummary } from "@sims/utilities/logger";
import { CustomNamedError, getFiscalYear } from "@sims/utilities";

/**
 * Chunk size for inserting invoices. The invoices (and its details) will
 * be grouped in chunks to be inserted in the database.
 */
const INVOICES_CHUNK_SIZE_INSERTS = 150;
/**
 * Number of digits for the invoice batch name sequence.
 */
const BATCH_NAME_SEQUENCE_PAD = 3;
/**
 * Number to be subtracted from the year to get the
 * two digits format to be used in the invoice batch name
 * and invoice number.
 */
const YEAR_ADJUSTMENT = 2000;

@Injectable()
export class CASInvoiceBatchService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly sequenceControlService: SequenceControlService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Find e-Cert receipts that have no valid invoice associated,
   * creating a new invoice batch to be sent to CAS if some
   * pending receipts are found.
   * @param processSummary process summary for logging.
   * @returns new invoice batch and related data or null.
   */
  async createInvoiceBatch(
    processSummary: ProcessSummary,
  ): Promise<CASInvoiceBatch | null> {
    return this.dataSource.transaction(async (entityManager) => {
      const now = new Date();
      // Gets the current fiscal year to be used (e.g. 2025) and adjust it to 2 digits only (e.g. 25).
      const fiscalYear = getFiscalYear(now) - YEAR_ADJUSTMENT;
      let newBatchUniqueSequence: number;
      // Consumes the next sequence number and prevent concurrent access.
      // The sequence resets every fiscal year.
      await this.sequenceControlService.consumeNextSequenceWithExistingEntityManager(
        `CAS_INVOICE_BATCH_${fiscalYear}`,
        entityManager,
        async (nextSequenceNumber: number) => {
          newBatchUniqueSequence = nextSequenceNumber;
        },
      );
      processSummary.info("Checking for pending receipts.");
      const pendingReceipts = await this.getPendingReceiptsForInvoiceBatch(
        entityManager,
      );
      if (!pendingReceipts.length) {
        processSummary.info("No pending receipts found.");
        // Cancels the transaction to rollback the batch number.
        throw new CustomNamedError(
          "Rollback current database for invoice batch processing.",
          DATABASE_TRANSACTION_CANCELLATION,
        );
      }
      processSummary.info(`Found ${pendingReceipts.length} pending receipts.`);
      // Create the new invoice batch.
      const invoiceBatch = new CASInvoiceBatch();
      // Create the batch name.
      const batchCounter = newBatchUniqueSequence
        .toString()
        .padStart(BATCH_NAME_SEQUENCE_PAD, "0");
      invoiceBatch.batchName = `PSFS${fiscalYear}${batchCounter}-${pendingReceipts.length}`;
      invoiceBatch.batchDate = now;
      invoiceBatch.approvalStatus = CASInvoiceBatchApprovalStatus.Pending;
      invoiceBatch.approvalStatusUpdatedOn = now;
      invoiceBatch.approvalStatusUpdatedBy = this.systemUsersService.systemUser;
      invoiceBatch.creator = this.systemUsersService.systemUser;
      invoiceBatch.createdAt = now;
      invoiceBatch.updatedAt = now;
      // Save the invoice batch to allow the ID to be known and associate with every new
      // invoice created. It would allow the invoices to be saved in chunks.
      await entityManager.getRepository(CASInvoiceBatch).save(invoiceBatch);
      // Accumulates the invoices to be returned later.
      let casInvoices: CASInvoice[];
      // Get active distribution accounts to be associated with each invoice detail.
      const distributionAccounts = await this.getActiveDistributionAccounts(
        entityManager,
      );
      await this.sequenceControlService.consumeNextSequenceWithExistingEntityManager(
        `CAS_INVOICE_${fiscalYear}`,
        entityManager,
        async (nextSequenceNumber: number) => {
          casInvoices = this.createInvoices(
            invoiceBatch.id,
            pendingReceipts,
            distributionAccounts,
            nextSequenceNumber,
            now,
            processSummary,
          );
          return nextSequenceNumber + casInvoices.length;
        },
      );
      await entityManager.getRepository(CASInvoice).save(casInvoices, {
        chunk: INVOICES_CHUNK_SIZE_INSERTS,
      });
      // Associate the created invoices to the batch to be returned.
      invoiceBatch.casInvoices = casInvoices;
      return invoiceBatch;
    });
  }

  /**
   * Create a list of CAS invoices from a list of pending receipts, given their
   * distribution accounts and a new sequence number.
   * @param invoiceBatchID ID of the invoice batch to be associated with the new invoices.
   * @param pendingReceipts list of pending receipts to be processed.
   * @param distributionAccounts active distribution accounts to be filtered and then
   * associated with each invoice detail.
   * @param newInvoiceSequence the sequence number to be used as a starting point to create the invoices.
   * @param referenceDate date to be used to as reference for created records.
   * @param parentProcessSummary the parent process summary to log the process.
   * @returns the list of new CAS invoices created.
   */
  private createInvoices(
    invoiceBatchID: number,
    pendingReceipts: DisbursementReceipt[],
    distributionAccounts: CASDistributionAccount[],
    newInvoiceSequence: number,
    referenceDate: Date,
    parentProcessSummary: ProcessSummary,
  ): CASInvoice[] {
    const casInvoices: CASInvoice[] = [];
    const invoicesSummary = new ProcessSummary();
    const systemUser = this.systemUsersService.systemUser;
    parentProcessSummary.children(invoicesSummary);
    // Start processing the invoices for each pending receipt.
    for (const receipt of pendingReceipts) {
      invoicesSummary.info(`Creating invoice for receipt ID ${receipt.id}.`);
      const student =
        receipt.disbursementSchedule.studentAssessment.application.student;
      const offeringIntensity =
        receipt.disbursementSchedule.studentAssessment.offering
          .offeringIntensity;
      // Create a new invoice for the receipt.
      const newInvoice = new CASInvoice();
      newInvoice.casInvoiceBatch = { id: invoiceBatchID } as CASInvoiceBatch;
      newInvoice.disbursementReceipt = receipt;
      newInvoice.casSupplier = student.casSupplier;
      newInvoice.invoiceNumber = this.createInvoiceNumberIdentifier(
        receipt,
        newInvoiceSequence,
      );
      newInvoiceSequence++;
      newInvoice.invoiceStatus = CASInvoiceStatus.Pending;
      newInvoice.invoiceStatusUpdatedOn = referenceDate;
      newInvoice.creator = systemUser;
      newInvoice.invoiceStatusUpdatedBy = systemUser;
      newInvoice.createdAt = referenceDate;
      newInvoice.updatedAt = referenceDate;
      // Create invoice details.
      newInvoice.casInvoiceDetails = this.createInvoiceDetails(
        receipt.disbursementSchedule.disbursementValues,
        offeringIntensity,
        distributionAccounts,
        referenceDate,
      );
      casInvoices.push(newInvoice);
      invoicesSummary.info(
        `Invoice ${newInvoice.invoiceNumber} created for receipt ID ${receipt.id}.`,
      );
      newInvoice.casInvoiceDetails.forEach((detail) => {
        invoicesSummary.info(
          `Created invoice detail for award ${detail.casDistributionAccount.awardValueCode}(${detail.casDistributionAccount.operationCode}).`,
        );
      });
    }
    return casInvoices;
  }

  /**
   * Create a unique invoice number identifier.
   * @param receipt disbursement receipt to be used for creating the invoice number.
   * @param invoiceSequence fiscal year sequence number to be used for creating the invoice number.
   * @returns unique invoice number identifier.
   */
  private createInvoiceNumberIdentifier(
    receipt: DisbursementReceipt,
    invoiceSequence: number,
  ): string {
    // Shortened variables to improve readability.
    const schedule = receipt.disbursementSchedule;
    const application = schedule.studentAssessment.application;
    const student = application.student;
    const offering = schedule.studentAssessment.offering;
    // Variables to create the invoice number.
    const programYearEndDateYear =
      new Date(application.programYear.endDate).getFullYear() - YEAR_ADJUSTMENT;
    const institutionCode = offering.institutionLocation.institutionCode;
    const documentNumber = schedule.documentNumber;
    return `${programYearEndDateYear}S${institutionCode}${student.casSupplier.supplierNumber}-${documentNumber}-${invoiceSequence}`;
  }

  /**
   * Creates invoice details to be associated with an invoice to be saved to the database.
   * @param disbursedAwards disbursed awards to be used for creating the invoice details.
   * @param offeringIntensity offering intensity used to filter the distribution accounts.
   * @param distributionAccounts list of all active distribution accounts to allow the creation of the
   * invoice details for each disbursed award.
   * @param referenceDate date to be used to as reference for created records.
   * @returns invoice details to be associated with an invoice.
   */
  private createInvoiceDetails(
    disbursedAwards: Pick<DisbursementValue, "valueCode" | "effectiveAmount">[],
    offeringIntensity: string,
    distributionAccounts: CASDistributionAccount[],
    referenceDate: Date,
  ): CASInvoiceDetail[] {
    // New invoice creation.
    const invoiceDetails: CASInvoiceDetail[] = [];
    for (const disbursedAward of disbursedAwards) {
      // Find the distribution accounts for the award.
      const accounts = distributionAccounts.filter(
        (account) =>
          account.awardValueCode === disbursedAward.valueCode &&
          account.offeringIntensity === offeringIntensity,
      );
      if (!accounts.length) {
        throw new Error(
          `No distribution accounts found for award ${disbursedAward.valueCode} and offering intensity ${offeringIntensity}.`,
        );
      }
      // Create invoice details for each distribution account.
      const awardInvoiceDetails = accounts.map((account) => {
        const invoiceDetail = new CASInvoiceDetail();
        invoiceDetail.casDistributionAccount = account;
        invoiceDetail.valueAmount = disbursedAward.effectiveAmount;
        invoiceDetail.creator = this.systemUsersService.systemUser;
        invoiceDetail.createdAt = referenceDate;
        invoiceDetail.updatedAt = referenceDate;
        return invoiceDetail;
      });
      invoiceDetails.push(...awardInvoiceDetails);
    }
    return invoiceDetails;
  }

  /**
   * Retrieves all active distribution accounts to generate invoice details.
   * @param entityManager entity manager to be used for the query.
   * @returns list of active distribution accounts.
   */
  private async getActiveDistributionAccounts(
    entityManager: EntityManager,
  ): Promise<CASDistributionAccount[]> {
    return entityManager.getRepository(CASDistributionAccount).find({
      select: {
        id: true,
        awardValueCode: true,
        offeringIntensity: true,
        operationCode: true,
      },
      where: { isActive: true },
    });
  }

  /**
   * Retrieves the disbursement receipts that have no valid invoice associated,
   * filtering only the receipts with BC Grant values and valid CAS supplier.
   * @param entityManager entity manager to be used for the query.
   * @returns list of disbursement receipts without valid invoice.
   */
  private async getPendingReceiptsForInvoiceBatch(
    entityManager: EntityManager,
  ): Promise<DisbursementReceipt[]> {
    const existsInvoice = entityManager
      .getRepository(CASInvoice)
      .createQueryBuilder("casInvoice")
      .select("1")
      .where("casInvoice.disbursementReceipt.id = disbursementReceipt.id")
      .getSql();
    return entityManager
      .getRepository(DisbursementReceipt)
      .createQueryBuilder("disbursementReceipt")
      .select([
        "disbursementReceipt.id",
        "disbursementSchedule.id",
        "disbursementSchedule.documentNumber",
        "studentAssessment.id",
        "offering.id",
        "offering.offeringIntensity",
        "application.id",
        "student.id",
        "casSupplier.id",
        "casSupplier.supplierNumber",
        "disbursementValue.id",
        "disbursementValue.valueCode",
        "disbursementValue.effectiveAmount",
        "programYear.id",
        "programYear.endDate",
        "institutionLocation.id",
        "institutionLocation.institutionCode",
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
      .innerJoin("studentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("application.programYear", "programYear")
      .innerJoin("student.casSupplier", "casSupplier")
      .where("disbursementReceipt.fundingType != :federalFundingType", {
        federalFundingType: RECEIPT_FUNDING_TYPE_FEDERAL,
      })
      .andWhere("disbursementReceiptValue.grantType = :grantType", {
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
