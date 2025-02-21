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
} from "@sims/sims-db";
import {
  processInParallel,
  CustomNamedError,
  getAbbreviatedDateOnlyFormat,
} from "@sims/utilities";
import { ProcessSummary } from "@sims/utilities/logger";
import { PendingInvoiceResult } from "./cas-invoice.models";
import { DataSource } from "typeorm";

@Injectable()
export class CASInvoiceService {
  constructor(
    private readonly casService: CASService,
    private readonly dataSource: DataSource,
  ) {}
  /**
   * Get the list of pending invoices to be sent from the approved batch.
   * @returns list of pending invoices.
   */
  async getPendingInvoices(): Promise<CASInvoice[]> {
    const pendingInvoices = await this.dataSource
      .getRepository(CASInvoice)
      .find({
        select: {
          id: true,
          casSupplier: {
            id: true,
            supplierNumber: true,
            supplierAddress: { supplierSiteCode: true },
          },
          createdAt: true,
          invoiceNumber: true,
          disbursementReceipt: {
            id: true,
            fileDate: true,
          },
          casInvoiceBatch: {
            id: true,
            batchName: true,
            batchDate: true,
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
      });
    return pendingInvoices;
  }

  /**
   * Send pending invoices to CAS.
   * @param parentProcessSummary parent process summary for logging.
   * @param pendingInvoices pending invoices.
   * @returns number of updated invoices.
   */

  async sendInvoices(
    parentProcessSummary: ProcessSummary,
    pendingInvoices: CASInvoice[],
  ): Promise<number> {
    // Process each invoice in parallel.
    const processesResults = await processInParallel(
      (pendingInvoice) =>
        this.processInvoice(pendingInvoice, parentProcessSummary),
      pendingInvoices,
    );
    // Get the number of updated invoices.
    const updatedInvoices = processesResults.filter(
      (processResult) => !!processResult?.isInvoiceUpdated,
    ).length;
    return updatedInvoices;
  }

  /**
   * Process and send an invoice to CAS.
   * @param pendingInvoice pending invoice.
   * @param parentProcessSummary parent process summary for logging.
   * @returns processor result.
   */
  private async processInvoice(
    pendingInvoice: CASInvoice,
    parentProcessSummary: ProcessSummary,
  ): Promise<PendingInvoiceResult | null> {
    const summary = new ProcessSummary();
    parentProcessSummary.children(summary);
    // Log information about the pending invoice being processed.
    summary.info(
      `Processing pending invoice: ${pendingInvoice.invoiceNumber}.`,
    );
    const pendingInvoicePayload = this.getPendingInvoicePayload(pendingInvoice);
    summary.info(`Pending invoice payload: ${pendingInvoicePayload}.`);
    try {
      const response = await this.casService.sendPendingInvoices(
        pendingInvoicePayload,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        if (error.name === CAS_BAD_REQUEST) {
          return {
            isInvoiceUpdated: false,
            knownErrors: error.objectInfo as string[],
          };
        }
      }
      throw error;
    }
    return {
      isInvoiceUpdated: true,
    };
  }

  /**
   * Generate the pending invoice payload.
   * @param pendingInvoice pending invoice.
   * @returns pending invoice payload.
   */
  private getPendingInvoicePayload(
    pendingInvoice: CASInvoice,
  ): PendingInvoicePayload {
    // Fixed values as constants
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
      glDate: getAbbreviatedDateOnlyFormat(
        pendingInvoice.casInvoiceBatch.createdAt,
      ),
      invoiceBatchName: pendingInvoice.casInvoiceBatch.batchName,
      currencyCode: CURRENCY_CODE,
      invoiceLineDetails: invoiceLineDetails,
    };
  }
}
