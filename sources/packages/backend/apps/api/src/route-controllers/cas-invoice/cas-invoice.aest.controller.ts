import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
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
  CASInvoicePaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import { CASInvoiceService } from "../../services";
import { CASInvoiceAPIOutDTO } from "./models/cas-invoice.dto";
import { CASInvoiceStatus } from "@sims/sims-db";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Roles(Role.AESTCASInvoicing)
@Groups(UserGroups.AESTUser)
@Controller("cas-invoice")
@ApiTags(`${ClientTypeBaseRoute.AEST}-cas-invoice`)
export class CASInvoiceAESTController extends BaseController {
  constructor(private readonly casInvoiceService: CASInvoiceService) {
    super();
  }

  /**
   * Retrieves all CAS invoices.
   * @param paginationOptions pagination options.
   * @returns list of all invoices.
   */
  @Get()
  async getInvoices(
    @Query() paginationOptions: CASInvoicePaginationOptionsAPIInDTO,
  ): Promise<PaginatedResultsAPIOutDTO<CASInvoiceAPIOutDTO>> {
    const pagination = await this.casInvoiceService.getCASInvoices(
      paginationOptions,
    );
    const invoices = pagination.results.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceStatus: invoice.invoiceStatus,
      invoiceStatusUpdatedOn: invoice.invoiceStatusUpdatedOn,
      invoiceBatchName: invoice.casInvoiceBatch.batchName,
      supplierNumber: invoice.casSupplier.supplierNumber,
      errors: invoice.errors,
    }));
    return {
      results: invoices,
      count: pagination.count,
    };
  }

  /**
   * Updates CAS invoice status.
   * @param invoiceId invoice id.
   */
  @ApiNotFoundResponse({
    description: `CAS invoice not found.`,
  })
  @Patch(":invoiceId")
  async updateInvoiceStatus(
    @Param("invoiceId") invoiceId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const invoiceExists = await this.casInvoiceService.checkCASInvoiceExists(
      invoiceId,
    );
    if (!invoiceExists) {
      throw new NotFoundException("CAS invoice not found.");
    }
    await this.casInvoiceService.updateCASInvoiceStatus(
      invoiceId,
      CASInvoiceStatus.Resolved,
      userToken.userId,
    );
  }
}
