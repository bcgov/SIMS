import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CASInvoice, CASInvoiceBatch } from "@sims/sims-db";
import { Repository } from "typeorm";
import { unparse } from "papaparse";
import { CustomNamedError, getPSTPDTDateTime } from "@sims/utilities";
import { CASInvoiceBatchReport } from "./cas-invoice-batch.models";
import { CAS_INVOICE_BATCH_NOT_FOUND } from "../../constants";

@Injectable()
export class CASInvoiceBatchReportService {
  constructor(
    @InjectRepository(CASInvoiceBatch)
    private readonly casInvoiceBatchRepo: Repository<CASInvoiceBatch>,
  ) {}

  /**
   * Generates a report for a specific CAS invoice batch.
   * Retrieves the batch data and its invoices, then creates a detailed
   * report with information on each invoice and its related awards.
   * This report is meant to represent a snapshot of the batch data that
   * will be later submitted to CAS.
   * @param invoiceBatchId ID of the CAS invoice batch to generate the report for.
   * @returns an object containing batch data and a CSV formatted string
   * data for the specified invoice batch.
   */
  async getCASInvoiceBatchReport(
    invoiceBatchId: number,
  ): Promise<CASInvoiceBatchReport> {
    const reportData = await this.getCASInvoiceBatchesReportData(
      invoiceBatchId,
    );
    if (!reportData) {
      throw new CustomNamedError(
        `CAS invoice batch with ID ${invoiceBatchId} not found.`,
        CAS_INVOICE_BATCH_NOT_FOUND,
      );
    }
    const report = reportData.casInvoices.flatMap((invoice) => {
      // Rows for a single invoice.
      // One row per award will be generated.
      const invoiceReportRows: Record<string, string>[] = [];
      // Invoice master details. Each award will have this information.
      const reportInvoiceMaster = this.createReportInvoiceMaster(invoice);
      // Get all unique awards for the invoice. Each award will be a row in the report.
      const awardCodes = new Set(
        invoice.casInvoiceDetails.map(
          (detail) => detail.casDistributionAccount.awardValueCode,
        ),
      );
      // Get the awards distribution details to be appended to the same row.
      awardCodes.forEach((awardCode) => {
        const awardAccounts = invoice.casInvoiceDetails.filter(
          (detail) =>
            detail.casDistributionAccount.awardValueCode === awardCode,
        );
        const reportInvoiceRow = {
          ...reportInvoiceMaster,
          "Award Type": awardCode,
        };
        awardAccounts.forEach((account) => {
          // Append the values for each operation code.
          const operation = account.casDistributionAccount.operationCode;
          reportInvoiceRow[`${operation} Amount`] =
            account.valueAmount.toString();
          reportInvoiceRow[`${operation} Account`] =
            account.casDistributionAccount.distributionAccount;
        });
        invoiceReportRows.push(reportInvoiceRow);
      });
      return invoiceReportRows;
    });
    const reportCSVContent = unparse(report);
    return {
      batchName: reportData.batchName,
      batchDate: reportData.batchDate,
      reportCSVContent,
    };
  }

  /**
   * Creates a row containing the master details for an invoice.
   * These details are common to all awards on the invoice.
   * @param invoice the CAS invoice to generate the report row for.
   * @returns a plain object with the report row data.
   */
  private createReportInvoiceMaster(
    invoice: CASInvoice,
  ): Record<string, string> {
    // Student data for easy access.
    const student =
      invoice.disbursementReceipt.disbursementSchedule.studentAssessment
        .application.student;
    // Schedule data for easy access.
    const schedule = invoice.disbursementReceipt.disbursementSchedule;
    return {
      "Invoice Number": invoice.invoiceNumber,
      "Given Names": student.user.firstName,
      "Last Name": student.user.lastName,
      SIN: student.sinValidation.sin,
      "Supplier Number": invoice.casSupplier.supplierNumber,
      "Document Number": schedule.documentNumber.toString(),
      "GL Date": getPSTPDTDateTime(invoice.disbursementReceipt.createdAt),
    };
  }

  /**
   * Retrieve a CAS invoice batch data required to be part of the report generation.
   * @param invoiceBatchId ID of the CAS invoice batch to be retrieved.
   * @returns the CAS invoice batch with all its invoices and related data.
   */
  private async getCASInvoiceBatchesReportData(
    invoiceBatchId: number,
  ): Promise<CASInvoiceBatch> {
    return this.casInvoiceBatchRepo.findOne({
      select: {
        id: true,
        batchName: true,
        batchDate: true,
        casInvoices: {
          id: true,
          invoiceNumber: true,
          invoiceStatus: true,
          casSupplier: { id: true, supplierNumber: true },
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
          disbursementReceipt: {
            id: true,
            createdAt: true,
            disbursementSchedule: {
              id: true,
              documentNumber: true,
              studentAssessment: {
                id: true,
                application: {
                  id: true,
                  student: {
                    id: true,
                    user: { id: true, firstName: true, lastName: true },
                    sinValidation: { id: true, sin: true },
                  },
                },
              },
            },
          },
        },
      },
      relations: {
        casInvoices: {
          casSupplier: true,
          casInvoiceDetails: { casDistributionAccount: true },
          disbursementReceipt: {
            disbursementSchedule: {
              studentAssessment: {
                application: {
                  student: { user: true, sinValidation: true },
                },
              },
            },
          },
        },
      },
      where: { id: invoiceBatchId },
      order: {
        casInvoices: {
          casInvoiceDetails: {
            casDistributionAccount: {
              awardValueCode: "ASC",
              operationCode: "ASC",
            },
          },
          casSupplier: {
            supplierNumber: "ASC",
          },
          disbursementReceipt: {
            disbursementSchedule: {
              documentNumber: "ASC",
            },
          },
        },
      },
    });
  }
}
