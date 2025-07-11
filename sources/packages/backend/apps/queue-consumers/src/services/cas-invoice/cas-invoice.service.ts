import { Injectable } from "@nestjs/common";
import {
  CASService,
  PendingInvoicePayload,
  InvoiceLineDetail,
} from "@sims/integrations/cas";
import { CAS_BAD_REQUEST } from "@sims/integrations/constants";
import {
  CASInvoice,
  CASInvoiceBatchApprovalStatus,
  CASInvoiceStatus,
  User,
} from "@sims/sims-db";
import {
  processInParallel,
  CustomNamedError,
  getAbbreviatedDateOnlyFormat,
  getPSTPDTDateFormatted,
  ABBREVIATED_MONTH_DATE_FORMAT,
} from "@sims/utilities";
import { ProcessSummary } from "@sims/utilities/logger";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemUsersService } from "@sims/services";

@Injectable()
export class CASInvoiceService {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    private readonly casService: CASService,
    @InjectRepository(CASInvoice)
    private readonly casInvoiceRepo: Repository<CASInvoice>,
  ) {}

  /**
   * Get the list of pending invoices to be sent from the approved batch.
   * @param pollingRecordsLimit maximum number of records to be returned.
   * @returns list of pending invoices.
   */
  private async getPendingInvoices(
    pollingRecordsLimit: number,
  ): Promise<CASInvoice[]> {
    return this.casInvoiceRepo.find({
      select: {
        id: true,
        casSupplier: {
          id: true,
          supplierNumber: true,
          supplierAddress: true as unknown,
        },
        createdAt: true,
        invoiceNumber: true,
        disbursementReceipt: {
          id: true,
          fileDate: true,
          createdAt: true,
        },
        casInvoiceBatch: {
          id: true,
          batchName: true,
          batchDate: true,
          createdAt: true,
        },
        casInvoiceDetails: {
          id: true,
          valueAmount: true,
          casDistributionAccount: {
            id: true,
            operationCode: true,
            awardValueCode: true,
            distributionAccount: true,
          },
        },
      },
      relations: {
        casInvoiceBatch: true,
        disbursementReceipt: true,
        casSupplier: true,
        casInvoiceDetails: {
          casDistributionAccount: true,
        },
      },
      where: {
        casInvoiceBatch: {
          approvalStatus: CASInvoiceBatchApprovalStatus.Approved,
        },
        invoiceStatus: CASInvoiceStatus.Pending,
      },
      order: {
        createdAt: "ASC",
        casInvoiceDetails: {
          casDistributionAccount: {
            awardValueCode: "ASC",
            operationCode: "ASC",
          },
        },
      },
      take: pollingRecordsLimit,
    });
  }

  /**
   * Send pending invoices to CAS.
   * @param pollingRecordsLimit maximum number of records to be returned.
   * @param processSummary parent process summary for logging.
   */
  async sendInvoices(
    pollingRecordsLimit: number,
    processSummary: ProcessSummary,
  ): Promise<void> {
    processSummary.info("Checking for pending invoices.");
    const pendingInvoices = await this.getPendingInvoices(pollingRecordsLimit);
    if (pendingInvoices.length === 0) {
      processSummary.info("No pending invoices found.");
    } else {
      processSummary.info(
        `Found ${pendingInvoices.length} pending invoice(s) to be sent to CAS.`,
      );
      // Process each invoice in parallel.
      await processInParallel(
        (pendingInvoice) => this.processInvoice(pendingInvoice, processSummary),
        pendingInvoices,
      );
    }
  }

  /**
   * Process and send an invoice to CAS.
   * @param pendingInvoice pending invoice.
   * @param parentProcessSummary parent process summary for logging.
   */
  private async processInvoice(
    pendingInvoice: CASInvoice,
    parentProcessSummary: ProcessSummary,
  ): Promise<void> {
    const summary = new ProcessSummary();
    parentProcessSummary.children(summary);
    // Log information about the pending invoice being processed.
    summary.info(
      `Processing pending invoice: ${pendingInvoice.invoiceNumber}.`,
    );
    try {
      const now = new Date();
      const pendingInvoicePayload = this.getPendingInvoicePayload(
        pendingInvoice,
        now,
      );
      const response = await this.casService.sendInvoice(pendingInvoicePayload);
      if (response.invoiceNumber) {
        summary.info(`Invoice sent to CAS ${response.casReturnedMessages}.`);
      } else {
        summary.warn(
          `Invoice ${pendingInvoicePayload.invoiceNumber} sent to CAS was considered successful but returned additional message(s): ${response.casReturnedMessages}.`,
        );
      }
      await this.casInvoiceRepo.update(
        {
          id: pendingInvoice.id,
        },
        {
          invoiceStatus: CASInvoiceStatus.Sent,
          invoiceStatusUpdatedOn: now,
          dateSent: now,
          modifier: { id: this.systemUsersService.systemUser.id },
        },
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        if (error.name === CAS_BAD_REQUEST) {
          await this.processBadRequestErrors(
            pendingInvoice.id,
            summary,
            error.objectInfo as string[],
          );
          return;
        }
      }
      summary.error("Unexpected error while sending invoice to CAS.", error);
    }
  }

  /**
   * Process bad request errors from CAS API during invoice sending.
   * @param invoiceId invoice id.
   * @param summary summary for logging.
   * @param errors error object.
   */
  private async processBadRequestErrors(
    invoiceId: number,
    summary: ProcessSummary,
    errors: string[],
  ): Promise<void> {
    summary.warn("A known error occurred during processing.");
    const now = new Date();
    const auditUser = { id: this.systemUsersService.systemUser.id } as User;
    try {
      await this.casInvoiceRepo.update(
        {
          id: invoiceId,
        },
        {
          invoiceStatus: CASInvoiceStatus.ManualIntervention,
          invoiceStatusUpdatedOn: now,
          modifier: auditUser,
          errors,
        },
      );
      summary.info(
        `Set invoice status to ${CASInvoiceStatus.ManualIntervention} due to error(s): ${errors}.`,
      );
    } catch (error: unknown) {
      summary.error(
        `Failed to update invoice status to ${CASInvoiceStatus.ManualIntervention}.`,
        error,
      );
    }
  }

  /**
   * Generate the pending invoice payload.
   * @param pendingInvoice pending invoice.
   * @param invoiceSendDate date when the invoice is being sent.
   * @returns pending invoice payload.
   */
  private getPendingInvoicePayload(
    pendingInvoice: CASInvoice,
    invoiceSendDate: Date,
  ): PendingInvoicePayload {
    // Fixed values as constants.
    const INVOICE_TYPE = "Standard";
    const INVOICE_AMOUNT = 0;
    const PAY_GROUP = "GEN GLP";
    const REMITTANCE_CODE = "01";
    const SPECIAL_HANDLING = "N";
    const TERMS = "Immediate";
    const EMPTY_STRING = "";
    const CURRENCY_CODE = "CAD";
    const INVOICE_LINE_TYPE = "Item";

    // Get invoice line details.
    const invoiceLineDetails: InvoiceLineDetail[] =
      pendingInvoice.casInvoiceDetails.map((invoiceDetail, index) => ({
        invoiceLineType: INVOICE_LINE_TYPE,
        invoiceLineNumber: index + 1,
        lineCode: invoiceDetail.casDistributionAccount.operationCode,
        invoiceLineAmount: invoiceDetail.valueAmount,
        defaultDistributionAccount:
          invoiceDetail.casDistributionAccount.distributionAccount,
      }));
    return {
      invoiceType: INVOICE_TYPE,
      supplierNumber: pendingInvoice.casSupplier.supplierNumber,
      supplierSiteNumber:
        pendingInvoice.casSupplier.supplierAddress.supplierSiteCode,
      invoiceDate: getAbbreviatedDateOnlyFormat(
        pendingInvoice.disbursementReceipt.createdAt,
      ),
      invoiceNumber: pendingInvoice.invoiceNumber,
      invoiceAmount: INVOICE_AMOUNT,
      payGroup: PAY_GROUP,
      dateInvoiceReceived: getAbbreviatedDateOnlyFormat(
        pendingInvoice.disbursementReceipt.fileDate,
      ),
      remittanceCode: REMITTANCE_CODE,
      specialHandling: SPECIAL_HANDLING,
      terms: TERMS,
      remittanceMessage1: EMPTY_STRING,
      remittanceMessage2: EMPTY_STRING,
      // The GL date sent to CAS API must be in BC time.
      glDate: getPSTPDTDateFormatted(invoiceSendDate, {
        format: ABBREVIATED_MONTH_DATE_FORMAT,
      }),
      invoiceBatchName: pendingInvoice.casInvoiceBatch.batchName,
      currencyCode: CURRENCY_CODE,
      invoiceLineDetails: invoiceLineDetails,
    };
  }
}
