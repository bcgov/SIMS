import { Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties, UserGroups } from "../../auth";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { CASInvoiceBatchService } from "../../services";
import { CASInvoiceBatchesAPIOutDTO } from "./models/cas-invoice-batch.dto";
import { getUserFullName } from "../../utilities";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("cas-invoice-batch")
@ApiTags(`${ClientTypeBaseRoute.AEST}-cas-invoice-batch`)
export class CASInvoiceBatchAESTController extends BaseController {
  constructor(private readonly casInvoiceBatchService: CASInvoiceBatchService) {
    super();
  }

  @Get()
  async getInvoiceBatches(): Promise<CASInvoiceBatchesAPIOutDTO> {
    const invoiceBatches =
      await this.casInvoiceBatchService.getCASInvoiceBatches();
    return {
      batches: invoiceBatches.map((batch) => ({
        id: batch.id,
        batchName: batch.batchName,
        batchDate: batch.batchDate,
        approvalStatus: batch.approvalStatus,
        approvalStatusUpdatedOn: batch.approvalStatusUpdatedOn,
        approvalStatusUpdatedBy: getUserFullName(batch.approvalStatusUpdatedBy),
      })),
    };
  }

  @Post()
  async createInvoiceBatch(): Promise<PrimaryIdentifierAPIOutDTO> {
    const newBatch = await this.casInvoiceBatchService.createInvoiceBatch();
    return { id: newBatch.id };
  }
}
