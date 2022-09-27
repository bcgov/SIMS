import { Controller, Post } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { FedRestrictionProcessingService } from "../../esdc-integration/fed-restriction-integration/fed-restriction-processing.service";
import { ESDCFileResponseAPIOutDTO } from "./models/esdc.dto";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("fed-restrictions")
@ApiTags(`${ClientTypeBaseRoute.SystemAccess}-fed-restrictions`)
export class FedRestrictionsIntegrationSystemAccessController extends BaseController {
  constructor(
    private readonly processingService: FedRestrictionProcessingService,
  ) {
    super();
  }

  @Post("process")
  async processFedRestrictionsImport(): Promise<ESDCFileResponseAPIOutDTO> {
    this.logger.log("Starting federal restrictions import...");
    const uploadResult = await this.processingService.process();
    this.logger.log("Federal restrictions import process finished.");
    return {
      processSummary: uploadResult.processSummary,
      errorsSummary: uploadResult.errorsSummary,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
