import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties, Role, UserGroups } from "../../auth";
import { AllowAuthorizedParty, Groups, Roles } from "../../auth/decorators";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { CASInvoiceBatchService } from "../../services";
import { CASInvoiceBatchAPIOutDTO } from "./models/cas-invoice-batch.dto";
import { getUserFullName } from "../../utilities";
import {
  CASInvoiceBatchesPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import {
  appendByteOrderMark,
  getFileNameAsCurrentTimestamp,
} from "@sims/utilities";
import { Response } from "express";
import { Readable } from "stream";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("cas-invoice-batch")
@ApiTags(`${ClientTypeBaseRoute.AEST}-cas-invoice-batch`)
export class CASInvoiceBatchAESTController extends BaseController {
  constructor(private readonly casInvoiceBatchService: CASInvoiceBatchService) {
    super();
  }

  /**
   * Retrieves all CAS invoice batches.
   * @param paginationOptions pagination options.
   * @returns list of all invoice batches.
   */
  @Get()
  @Roles(Role.AESTEditCASSupplierInfo) // TODO: Create a new role.
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
  @Roles(Role.AESTEditCASSupplierInfo) // TODO: Create a new role.
  async getInvoiceBatchesReport(
    @Param("casInvoiceBatchId", ParseIntPipe) casInvoiceBatchId: number,
    @Res() response: Response,
  ): Promise<void> {
    const invoiceReport =
      await this.casInvoiceBatchService.getCASInvoiceBatchesReport(
        casInvoiceBatchId,
      );
    const batchDate = getFileNameAsCurrentTimestamp(invoiceReport.batchDate);
    const filename = `${invoiceReport.batchName}_${batchDate}.csv`;
    // Adding byte order mark characters to the original file content as applications
    // like excel would look for BOM characters to view the file as UTF8 encoded.
    // Append byte order mark characters only if the file content is not empty.
    // TODO: move to a utility?
    const responseBuffer = appendByteOrderMark(invoiceReport.reportCSVContent);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename=${filename}`,
    );
    response.setHeader("Content-Type", "text/csv");
    response.setHeader("Content-Length", responseBuffer.byteLength);
    const stream = new Readable();
    stream.push(responseBuffer);
    stream.push(null);
    stream.pipe(response);
  }
}
