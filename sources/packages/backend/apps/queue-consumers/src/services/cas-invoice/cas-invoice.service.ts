import { Injectable } from "@nestjs/common";
import {
  CASService,
  PendingInvoicePayload,
  InvoiceLineDetail,
  SendPendingInvoicesResponse,
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
} from "@sims/utilities";
import { ProcessSummary } from "@sims/utilities/logger";
import { DataSource, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemUsersService } from "@sims/services";

@Injectable()
export class CASInvoiceService {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    private readonly casService: CASService,
    @InjectRepository(CASInvoice)
    private readonly casInvoiceRepo: Repository<CASInvoice>,
    private readonly dataSource: DataSource,
  ) {}
  /**
   * Get the list of pending invoices to be sent from the approved batch.
   * @param pollingRecordsLimit maximum number of records to be returned.
   * @returns list of pending invoices.
   */
  async getPendingInvoices(pollingRecordsLimit: number): Promise<CASInvoice[]> {
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
        take: pollingRecordsLimit,
      });
    return pendingInvoices;
  }

  /**
   * Send pending invoices to CAS.
   * @param parentProcessSummary parent process summary for logging.
   * @param pendingInvoices pending invoices.
   */

  async sendInvoices(
    parentProcessSummary: ProcessSummary,
    pendingInvoices: CASInvoice[],
  ): Promise<void> {
    // Process each invoice in parallel.
    await processInParallel(
      (pendingInvoice) =>
        this.processInvoice(pendingInvoice, parentProcessSummary),
      pendingInvoices,
    );
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
    // Log information about the pending invoice being processed.
    parentProcessSummary.info(
      `Processing pending invoice: ${pendingInvoice.invoiceNumber}.`,
    );
    const pendingInvoicePayload = this.getPendingInvoicePayload(pendingInvoice);
    parentProcessSummary.info(
      `Pending invoice payload invoice number: ${pendingInvoicePayload.invoiceNumber}.`,
    );
    let response: SendPendingInvoicesResponse;
    try {
      response = await this.casService.sendPendingInvoices(
        pendingInvoicePayload,
      );
      response.invoiceNumber
        ? parentProcessSummary.info(
            `Invoice sent to CAS ${response.casReturnedMessages}.`,
          )
        : parentProcessSummary.warn(
            `Invoice ${pendingInvoicePayload.invoiceNumber} send to CAS did not succeed. Reason: ${response.casReturnedMessages}.`,
          );
      await this.dataSource.getRepository(CASInvoice).update(
        {
          id: pendingInvoice.id,
        },
        {
          invoiceStatus: CASInvoiceStatus.Sent,
          invoiceStatusUpdatedOn: new Date(),
          modifier: { id: this.systemUsersService.systemUser.id },
        },
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        if (error.name === CAS_BAD_REQUEST) {
          parentProcessSummary.warn("Known CAS error while sending invoice.");
          await this.processBadRequestErrors(
            pendingInvoice.id,
            parentProcessSummary,
            error.objectInfo as string[],
            this.systemUsersService.systemUser.id,
          );
        }
      } else {
        parentProcessSummary.error(
          "Unexpected error while sending invoice to CAS.",
          error,
        );
        return null;
      }
    }
  }

  /**
   * Process bad request errors from CAS API during invoice sending.
   * @param invoiceId invoice id.
   * @param summary summary for logging.
   * @param error error object.
   * @param auditUserId audit user id.
   */
  async processBadRequestErrors(
    invoiceId: number,
    summary: ProcessSummary,
    error: string[],
    auditUserId: number,
  ): Promise<void> {
    summary.warn("A known error occurred during processing.");
    const now = new Date();
    const auditUser = { id: auditUserId } as User;
    try {
      await this.casInvoiceRepo.update(
        {
          id: invoiceId,
        },
        {
          invoiceStatus: CASInvoiceStatus.ManualIntervention,
          invoiceStatusUpdatedOn: now,
          modifier: auditUser,
          errors: error,
        },
      );
      summary.info(
        `Set invoice status to ${CASInvoiceStatus.ManualIntervention} due to Error(s):${error}.`,
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
   * @returns pending invoice payload.
   */
  private getPendingInvoicePayload(
    pendingInvoice: CASInvoice,
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
      glDate: getAbbreviatedDateOnlyFormat(
        pendingInvoice.casInvoiceBatch.createdAt,
      ),
      invoiceBatchName: pendingInvoice.casInvoiceBatch.batchName,
      currencyCode: CURRENCY_CODE,
      invoiceLineDetails: invoiceLineDetails,
    };
  }
}
