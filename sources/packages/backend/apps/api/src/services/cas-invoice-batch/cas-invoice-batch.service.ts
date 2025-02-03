import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CASInvoiceBatch } from "@sims/sims-db";
import { In, Repository } from "typeorm";
import {
  CASInvoiceBatchesPaginationOptions,
  getUserFullName,
  PaginatedResults,
} from "../../utilities";
import { unparse } from "papaparse";
import { getPSTPDTDateTime } from "@sims/utilities";
import { CASInvoiceBatchReport } from "./cas-invoice-batch.models";

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
   * Generates a report for a specific CAS invoice batch.
   * Retrieves the batch data and its invoices, then creates a detailed
   * report with information on each invoice and its related awards.
   * The report includes details such as batch name, date, invoice number,
   * student information, supplier number, document number, and distribution
   * details for each award.
   * @param invoiceBatchId ID of the CAS invoice batch to generate the report for.
   * @returns a CSV formatted string containing the report data for the specified invoice batch.
   */
  async getCASInvoiceBatchesReport(
    invoiceBatchId: number,
  ): Promise<CASInvoiceBatchReport> {
    const reportData = await this.getCASInvoiceBatchesReportData(
      invoiceBatchId,
    );
    const report = reportData.casInvoices.flatMap((invoice) => {
      // Rows for a single invoice.
      // One row per award will be generated.
      const invoiceReportRows: Record<string, string>[] = [];
      // Student data for easy access.
      const student =
        invoice.disbursementReceipt.disbursementSchedule.studentAssessment
          .application.student;
      // Schedule data for easy access.
      const schedule = invoice.disbursementReceipt.disbursementSchedule;
      // Invoice master details. Each award will have this information.
      const reportInvoiceMaster: Record<string, string> = {
        "Invoice Number": invoice.invoiceNumber,
        "Given Names": student.user.firstName,
        "Last Name": student.user.lastName,
        SIN: student.sinValidation.sin,
        "Supplier Number": invoice.casSupplier.supplierNumber,
        "Document Number": schedule.documentNumber.toString(),
        "GL Date": getPSTPDTDateTime(invoice.disbursementReceipt.createdAt),
      };
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
