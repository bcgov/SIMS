import { Controller, Get, Query } from "@nestjs/common";
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
}
