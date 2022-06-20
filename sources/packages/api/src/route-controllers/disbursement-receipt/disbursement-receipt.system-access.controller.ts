import { Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import { DisbursementReceiptProcessingService } from "../../esdc-integration/disbursement-receipt-integration/disbursement-receipt-processing.service";
import { ClientTypeBaseRoute } from "../../types";
import { ESDCFileResponseAPIOutDTO } from "../models/esdc.shared.dto";
import BaseController from "../BaseController";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("disbursement-receipt")
@ApiTags(`${ClientTypeBaseRoute.SystemAccess}-disbursement-receipt`)
export class DisbursementReceiptSystemAccessController extends BaseController {
  constructor(
    private readonly disbursementReceiptProcessingService: DisbursementReceiptProcessingService,
  ) {
    super();
  }

  @Post()
  async processDisbursementReceipts(
    @UserToken() userToken: IUserToken,
  ): Promise<ESDCFileResponseAPIOutDTO> {
    const response = await this.disbursementReceiptProcessingService.process(
      userToken.userId,
    );
    return {
      processSummary: response.processSummary,
      errorsSummary: response.errorsSummary,
    };
  }
}
