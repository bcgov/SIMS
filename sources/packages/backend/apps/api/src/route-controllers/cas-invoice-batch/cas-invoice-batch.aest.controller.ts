import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { AuthorizedParties, Role, UserGroups } from "../../auth";
import { AllowAuthorizedParty, Groups, Roles } from "../../auth/decorators";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import {
  CASInvoiceBatchReportService,
  CASInvoiceBatchService,
} from "../../services";
import { CASInvoiceBatchAPIOutDTO } from "./models/cas-invoice-batch.dto";
import { getUserFullName } from "../../utilities";
import {
  CASInvoiceBatchesPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import {
  CustomNamedError,
  getFileNameAsCurrentTimestamp,
} from "@sims/utilities";
import { Response } from "express";
import { streamFile } from "../utils";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Roles(Role.AESTCASInvoicing)
@Groups(UserGroups.AESTUser)
@Controller("cas-invoice-batch")
@ApiTags(`${ClientTypeBaseRoute.AEST}-cas-invoice-batch`)
export class CASInvoiceBatchAESTController extends BaseController {
  constructor(
    private readonly casInvoiceBatchService: CASInvoiceBatchService,
    private readonly casInvoiceBatchReportService: CASInvoiceBatchReportService,
  ) {
    super();
  }

  /**
   * Retrieves all CAS invoice batches.
   * @param paginationOptions pagination options.
   * @returns list of all invoice batches.
   */
  @Get()
  async getInvoiceBatches(
    @Query() paginationOptions: CASInvoiceBatchesPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResultsAPIOutDTO<CASInvoiceBatchAPIOutDTO>> {
    const pagination = await this.casInvoiceBatchService.getCASInvoiceBatches(
      paginationOptions,
    );
    const batches = pagination.results.map((batch) => ({
      id: batch.id,
      batchName: batch.batchName,
      batchDate: batch.batchDate,
      approvalStatus: batch.approvalStatus,
      approvalStatusUpdatedOn: batch.approvalStatusUpdatedOn,
      approvalStatusUpdatedBy: getUserFullName(batch.approvalStatusUpdatedBy),
    }));
    return {
      results: batches,
      count: pagination.count,
    };
  }

  /**
   * Batch invoices report with information to be reviewed by the Ministry
   * to support the batch approval and allow invoices to be sent to CAS.
   * @param casInvoiceBatchId batch ID to have the report generated for.
   * @returns list of all invoice batches.
   */
  @Get(":casInvoiceBatchId/report")
  @ApiNotFoundResponse({ description: "CAS invoice batch not found." })
  async getInvoiceBatchesReport(
    @Param("casInvoiceBatchId", ParseIntPipe) casInvoiceBatchId: number,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const invoiceReport =
        await this.casInvoiceBatchReportService.getCASInvoiceBatchesReport(
          casInvoiceBatchId,
        );
      const batchDate = getFileNameAsCurrentTimestamp(invoiceReport.batchDate);
      const filename = `${invoiceReport.batchName}_${batchDate}.csv`;
      streamFile(response, filename, {
        fileContent: invoiceReport.reportCSVContent,
      });
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === "CAS_INVOICE_BATCH_NOT_FOUND"
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
