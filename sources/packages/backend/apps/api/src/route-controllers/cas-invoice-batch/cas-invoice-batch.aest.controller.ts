import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Res,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthorizedParties, IUserToken, Role, UserGroups } from "../../auth";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import {
  CASInvoiceBatchReportService,
  CASInvoiceBatchService,
} from "../../services";
import {
  CASInvoiceBatchAPIOutDTO,
  UpdateCASInvoiceBatchAPIInDTO,
} from "./models/cas-invoice-batch.dto";
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
import {
  CAS_INVOICE_BATCH_NOT_FOUND,
  CAS_INVOICE_BATCH_NOT_PENDING,
} from "../../constants";

@AllowAuthorizedParty(AuthorizedParties.aest)
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
  @Roles(Role.AESTCASInvoicing)
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
   * @returns list of all invoices in the batch.
   */
  @Roles(Role.AESTCASInvoicing)
  @Get(":casInvoiceBatchId/report")
  @ApiNotFoundResponse({ description: "CAS invoice batch not found." })
  async getCASInvoiceBatchReport(
    @Param("casInvoiceBatchId", ParseIntPipe) casInvoiceBatchId: number,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const invoiceReport =
        await this.casInvoiceBatchReportService.getCASInvoiceBatchReport(
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
        error.name === CAS_INVOICE_BATCH_NOT_FOUND
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * Update the approval status for a CAS invoice batch record.
   * @param payload CAS invoice batch payload.
   * @param casInvoiceBatchId ID of the CAS invoice batch to be updated.
   */
  @Roles(Role.AESTCASExpenseAuthority)
  @Patch(":casInvoiceBatchId")
  @ApiNotFoundResponse({
    description: "CAS invoice batch not found.",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to update a CAS invoice batch.",
  })
  async updateCASInvoiceBatch(
    @Body() payload: UpdateCASInvoiceBatchAPIInDTO,
    @Param("casInvoiceBatchId", ParseIntPipe) casInvoiceBatchId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.casInvoiceBatchService.updateCASInvoiceBatch(
        casInvoiceBatchId,
        payload.approvalStatus,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        if (error.name === CAS_INVOICE_BATCH_NOT_FOUND) {
          throw new NotFoundException(error.message);
        }
        if (error.name === CAS_INVOICE_BATCH_NOT_PENDING) {
          throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }
}
